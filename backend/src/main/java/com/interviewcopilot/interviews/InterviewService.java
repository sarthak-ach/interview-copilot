package com.interviewcopilot.interviews;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewcopilot.common.KafkaEventPublisher;
import com.interviewcopilot.resumes.GeminiProvider;
import com.interviewcopilot.users.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class InterviewService {

    private static final Logger logger = LoggerFactory.getLogger(InterviewService.class);
    private final InterviewSessionRepository sessionRepository;
    private final InterviewMessageRepository messageRepository;
    private final GeminiProvider geminiProvider;
    private final StringRedisTemplate redisTemplate;
    private final KafkaEventPublisher kafkaEventPublisher;
    private final ObjectMapper objectMapper;

    public InterviewService(InterviewSessionRepository sessionRepository,
                            InterviewMessageRepository messageRepository,
                            GeminiProvider geminiProvider,
                            StringRedisTemplate redisTemplate,
                            KafkaEventPublisher kafkaEventPublisher) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.geminiProvider = geminiProvider;
        this.redisTemplate = redisTemplate;
        this.kafkaEventPublisher = kafkaEventPublisher;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public InterviewSession startSession(User user, String category, String difficulty, String demeanor) {
        InterviewSession session = new InterviewSession();
        session.setUser(user);
        session.setCategory(category);
        session.setDifficulty(difficulty);
        session.setDemeanor(demeanor);
        session.setCreatedAt(LocalDateTime.now());
        session = sessionRepository.save(session);

        // Publish start event
        kafkaEventPublisher.publishUserActivity("INTERVIEW_STARTED", user.getId(), "Started mock interview on category: " + category);

        // Call Gemini to generate the first question
        String firstQuestion;
        try {
            String prompt = String.format(
                    "You are an expert technical interviewer. You are conducting a technical mock interview for the track: '%s' at a '%s' level of difficulty with a '%s' demeanor. " +
                    "Your task is to generate the first, highly technical and specific interview question. " +
                    "Do NOT include any conversational introduction, filler, greeting, or explanation. Output ONLY the question text itself. Make sure to respond with a valid JSON object matching: " +
                    "{\n  \"question\": \"Your question here\"\n}",
                    category, difficulty, demeanor
            );
            String rawJson = geminiProvider.generate(prompt);
            JsonNode node = objectMapper.readTree(extractJson(rawJson));
            firstQuestion = node.path("question").asText("Explain how you would avoid N+1 queries in a Spring Boot service.");
        } catch (Exception e) {
            logger.error("Gemini AI failed to generate first question for track '{}' (user: {}). Falling back to default question. Exception: {}", category, user.getEmail(), e.getMessage(), e);
            firstQuestion = getDefaultQuestion(category);
        }

        InterviewMessage message = new InterviewMessage();
        message.setSession(session);
        message.setRole("AI");
        message.setContent(firstQuestion);
        messageRepository.save(message);

        return session;
    }

    @Transactional
    public InterviewMessage handleUserResponse(UUID sessionId, String userContent) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found with ID: " + sessionId));

        // Save user message
        InterviewMessage userMsg = new InterviewMessage();
        userMsg.setSession(session);
        userMsg.setRole("USER");
        userMsg.setContent(userContent);
        messageRepository.save(userMsg);

        // Publish response submission
        kafkaEventPublisher.publishUserActivity("INTERVIEW_ANSWER_SUBMITTED", session.getUser().getId(), "Submitted answer in session: " + sessionId);

        // Fetch conversation history
        List<InterviewMessage> history = messageRepository.findBySessionId(sessionId);
        
        // Count how many questions user has answered
        long userMsgCount = history.stream().filter(m -> "USER".equals(m.getRole())).count();

        String aiResponseContent;
        try {
            // Build conversation history transcript
            StringBuilder transcript = new StringBuilder();
            for (InterviewMessage msg : history) {
                transcript.append(msg.getRole()).append(": ").append(msg.getContent()).append("\n\n");
            }

            if (userMsgCount < 3) {
                // Generate next question
                String prompt = String.format(
                        "You are an expert technical interviewer conducting a mock interview for the track: '%s' at a '%s' level with a '%s' demeanor.\n\n" +
                        "Here is the dialogue history so far:\n%s" +
                        "Provide a very brief constructive feedback (1-2 sentences) on the candidate's last answer, and then ask the next technical question.\n" +
                        "Output ONLY a valid JSON object of the following format. Do NOT include markdown backticks or comments:\n" +
                        "{\n  \"feedback\": \"Your brief feedback...\",\n  \"nextQuestion\": \"Your next question...\"\n}",
                        session.getCategory(), session.getDifficulty(), session.getDemeanor(), transcript.toString()
                );
                String rawJson = geminiProvider.generate(prompt);
                JsonNode node = objectMapper.readTree(extractJson(rawJson));
                String feedback = node.path("feedback").asText("");
                String nextQuestion = node.path("nextQuestion").asText("");
                
                aiResponseContent = feedback + "\n\nHere is the next question:\n\n" + nextQuestion;
            } else {
                // Wrap up the interview
                String prompt = String.format(
                        "You are an expert technical interviewer conducting a mock interview for the track: '%s'. The candidate has completed all 3 questions.\n\n" +
                        "Here is the dialogue history:\n%s" +
                        "Provide a brief, final closing statement wrapping up the interview and informing the candidate that they can proceed to their evaluation.\n" +
                        "Output ONLY a valid JSON object matching:\n" +
                        "{\n  \"closing\": \"Your closing statement...\"\n}",
                        session.getCategory(), transcript.toString()
                );
                String rawJson = geminiProvider.generate(prompt);
                JsonNode node = objectMapper.readTree(extractJson(rawJson));
                aiResponseContent = node.path("closing").asText("Thank you for completing the mock interview! Please click the evaluate button to retrieve your scorecard.");
            }
        } catch (Exception e) {
            logger.error("Gemini AI failed to generate response/next question for session ID: {} (userMsgCount: {}). Falling back to heuristic response. Exception: {}", sessionId, userMsgCount, e.getMessage(), e);
            // Fallback heuristics
            aiResponseContent = getFallbackFeedbackAndQuestion(session.getCategory(), (int) userMsgCount);
        }

        InterviewMessage aiMsg = new InterviewMessage();
        aiMsg.setSession(session);
        aiMsg.setRole("AI");
        aiMsg.setContent(aiResponseContent);
        return messageRepository.save(aiMsg);
    }

    @Transactional
    public String evaluateSession(UUID sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found with ID: " + sessionId));

        // Check Redis cache first
        String cacheKey = "interview-evaluation:" + sessionId;
        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                logger.info("Redis cache HIT for interview evaluation: {}", cacheKey);
                return cached;
            }
        } catch (Exception e) {
            logger.warn("Redis read failed for evaluation: {}", e.getMessage());
        }

        List<InterviewMessage> history = messageRepository.findBySessionId(sessionId);
        StringBuilder transcript = new StringBuilder();
        for (InterviewMessage msg : history) {
            transcript.append(msg.getRole()).append(": ").append(msg.getContent()).append("\n\n");
        }

        String evaluationJson;
        int overallScore = 8;
        try {
            String prompt = String.format(
                    "You are an expert technical interviewer evaluating a mock interview for the track: '%s'.\n\n" +
                    "Below is the complete transcript of the interview:\n%s\n\n" +
                    "Conduct a detailed review and provide scores and constructive feedback. You MUST output ONLY a valid JSON object matching the following format. Do not include markdown backticks or comments:\n" +
                    "{\n" +
                    "  \"overallScore\": 8, // integer score from 1 to 10\n" +
                    "  \"clarityScore\": 8.5, // float/double score out of 10\n" +
                    "  \"fluencyScore\": 9.0, // float/double score out of 10\n" +
                    "  \"concurrencyScore\": 7.5, // float/double score out of 10\n" +
                    "  \"keyStrengths\": [\"Strength 1\", \"Strength 2\"], // up to 3 points\n" +
                    "  \"areasForGrowth\": [\"Growth 1\", \"Growth 2\"] // up to 3 points\n" +
                    "}",
                    session.getCategory(), transcript.toString()
            );

            String rawJson = geminiProvider.generate(prompt);
            evaluationJson = extractJson(rawJson);
            JsonNode node = objectMapper.readTree(evaluationJson);
            if (node.has("overallScore")) {
                overallScore = node.get("overallScore").asInt();
            }
        } catch (Exception e) {
            logger.error("Gemini AI failed to compile scorecard evaluation for session ID: {}. Falling back to default heuristics evaluation. Exception: {}", sessionId, e.getMessage(), e);
            Map<String, Object> heuristicData = getHeuristicEvaluation(session.getCategory());
            overallScore = (Integer) heuristicData.get("overallScore");
            try {
                evaluationJson = objectMapper.writeValueAsString(heuristicData);
            } catch (Exception ex) {
                evaluationJson = "{}";
            }
        }

        session.setScore(overallScore);
        session.setEvaluationJson(evaluationJson);
        sessionRepository.save(session);

        // Cache evaluation result in Redis
        try {
            redisTemplate.opsForValue().set(cacheKey, evaluationJson);
            logger.info("Cached interview scorecard in Redis for key '{}'", cacheKey);
        } catch (Exception re) {
            logger.warn("Failed to write scorecard to Redis: {}", re.getMessage());
        }

        // Publish evaluated event
        kafkaEventPublisher.publishUserActivity("INTERVIEW_EVALUATED", session.getUser().getId(), "Evaluated interview for session: " + sessionId + ", score: " + overallScore);

        return evaluationJson;
    }

    public List<InterviewMessage> getMessages(UUID sessionId) {
        return messageRepository.findBySessionId(sessionId);
    }

    public Optional<InterviewSession> getSession(UUID sessionId) {
        return sessionRepository.findById(sessionId);
    }

    private String extractJson(String text) {
        if (text == null) return "{}";
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    private String getDefaultQuestion(String category) {
        if (category != null && category.contains("React")) {
            return "How does the Virtual DOM work in React, and how does React optimize rendering updates?";
        } else if (category != null && category.contains("System Design")) {
            return "If you were designing a messaging service like WhatsApp, how would you handle delivery status indicators at scale?";
        } else {
            return "Explain how you would avoid N+1 queries in a Spring Boot service.";
        }
    }

    private String getFallbackFeedbackAndQuestion(String category, int answeredCount) {
        if (category != null && category.contains("React")) {
            if (answeredCount == 1) {
                return "Solid explanation of the reconciliation process. Let's look at state management and server interactions.\n\nHere is the next question:\n\nWhat are the benefits of using TanStack Query over simple useEffect-based data fetching?";
            } else if (answeredCount == 2) {
                return "Exactly! Out-of-the-box caching, background updates, and state synchronization save tons of boilerplate.\n\nHere is the next question:\n\nExplain how you would optimize a React page that is running slowly due to excessive re-renders.";
            }
        } else if (category != null && category.contains("System Design")) {
            if (answeredCount == 1) {
                return "Good job mapping state updates through WebSockets. Let's shift to resource estimation.\n\nHere is the next question:\n\nHow would you approach capacity estimation for YouTube bandwidth and storage requirements?";
            } else if (answeredCount == 2) {
                return "Clear estimations! Let's touch content delivery.\n\nHere is the next question:\n\nWhat is the role of a CDN in modern web architecture, and how do you handle cache invalidation?";
            }
        } else {
            if (answeredCount == 1) {
                return "Interesting points about N+1 queries. Let's move to database handling.\n\nHere is the next question:\n\nHow do you manage database transactions in Spring, and what are some common pitfalls with the @Transactional annotation?";
            } else if (answeredCount == 2) {
                return "Spot on about Spring's transactional proxy mechanism! Now let's tackle database concurrency.\n\nHere is the next question:\n\nWhat is the difference between optimistic locking and pessimistic locking in Spring Data JPA, and when would you use each?";
            }
        }
        return "Thank you for completing the mock interview! Please click the evaluate button to retrieve your scorecard.";
    }

    private Map<String, Object> getHeuristicEvaluation(String category) {
        Map<String, Object> map = new HashMap<>();
        map.put("overallScore", 8);
        map.put("clarityScore", 8.2);
        map.put("fluencyScore", 8.5);
        map.put("concurrencyScore", 7.8);
        map.put("keyStrengths", Arrays.asList(
                "Good conceptual understanding of core architectural and framework concepts.",
                "Structure and technical vocabulary were appropriate for the role level."
        ));
        map.put("areasForGrowth", Arrays.asList(
                "Could provide deeper implementation examples in high-concurrency situations.",
                "Focus on quantifying architectural trade-offs under high-write load."
        ));
        return map;
    }
}
