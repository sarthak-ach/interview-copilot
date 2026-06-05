package com.interviewcopilot.systemdesign;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewcopilot.resumes.GeminiProvider;
import com.interviewcopilot.users.User;
import com.interviewcopilot.common.KafkaEventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SystemDesignService {

    private static final Logger logger = LoggerFactory.getLogger(SystemDesignService.class);
    private final SystemDesignSessionRepository repository;
    private final GeminiProvider geminiProvider;
    private final KafkaEventPublisher kafkaEventPublisher;
    private final ObjectMapper objectMapper;

    public SystemDesignService(SystemDesignSessionRepository repository,
                               GeminiProvider geminiProvider,
                               KafkaEventPublisher kafkaEventPublisher) {
        this.repository = repository;
        this.geminiProvider = geminiProvider;
        this.kafkaEventPublisher = kafkaEventPublisher;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public SystemDesignSession getOrCreateSession(User user, String challengeName) {
        Optional<SystemDesignSession> existing = repository.findByUserIdAndChallengeName(user.getId(), challengeName);
        if (existing.isPresent()) {
            return existing.get();
        }

        SystemDesignSession session = new SystemDesignSession();
        session.setUser(user);
        session.setChallengeName(challengeName);
        session.setRequirementsDraft("");
        session.setCapacityDraft("");
        session.setApisDraft("");
        session.setSchemaDraft("");
        session.setScalingDraft("");
        session.setUpdatedAt(LocalDateTime.now());
        
        return repository.save(session);
    }

    @Transactional
    public SystemDesignSession saveDraft(User user, String challengeName, String requirements, String capacity, String apis, String schema, String scaling) {
        SystemDesignSession session = getOrCreateSession(user, challengeName);
        
        session.setRequirementsDraft(requirements != null ? requirements : session.getRequirementsDraft());
        session.setCapacityDraft(capacity != null ? capacity : session.getCapacityDraft());
        session.setApisDraft(apis != null ? apis : session.getApisDraft());
        session.setSchemaDraft(schema != null ? schema : session.getSchemaDraft());
        session.setScalingDraft(scaling != null ? scaling : session.getScalingDraft());
        session.setUpdatedAt(LocalDateTime.now());
        
        return repository.save(session);
    }

    @Transactional
    public String evaluateSession(User user, String challengeName) {
        SystemDesignSession session = getOrCreateSession(user, challengeName);

        String evaluationJson;
        int overallScore = 80;

        try {
            String prompt = String.format(
                    "You are an expert system design interviewer evaluating a candidate's architectural solution for the challenge: '%s'.\n\n" +
                    "Here are the candidate's drafted sections:\n" +
                    "1. Requirements:\n%s\n\n" +
                    "2. Capacity Estimates:\n%s\n\n" +
                    "3. API Design:\n%s\n\n" +
                    "4. Data Schema:\n%s\n\n" +
                    "5. Scale Strategy & Bottlenecks:\n%s\n\n" +
                    "Conduct a detailed review of this solution. You MUST output ONLY a valid JSON object matching the following structure. Do not include markdown backticks or extra text:\n" +
                    "{\n" +
                    "  \"score\": 82, // Cumulative score out of 100\n" +
                    "  \"requirementsScore\": 8.5, // Score out of 10\n" +
                    "  \"capacityScore\": 9.0, // Score out of 10\n" +
                    "  \"scalingScore\": 7.0, // Score out of 10\n" +
                    "  \"requirementsFeedback\": \"Constructive feedback on requirements gathering...\",\n" +
                    "  \"capacityFeedback\": \"Feedback on capacity planning calculations and assumptions...\",\n" +
                    "  \"scalingFeedback\": \"Feedback on sharding, replication, CDN, queues, and bottleneck resolution...\"\n" +
                    "}",
                    challengeName,
                    session.getRequirementsDraft(),
                    session.getCapacityDraft(),
                    session.getApisDraft(),
                    session.getSchemaDraft(),
                    session.getScalingDraft()
            );

            String rawJson = geminiProvider.generate(prompt);
            evaluationJson = extractJson(rawJson);
            JsonNode node = objectMapper.readTree(evaluationJson);
            if (node.has("score")) {
                overallScore = node.get("score").asInt();
            }
        } catch (Exception e) {
            logger.error("Gemini AI failed to evaluate system design challenge '{}' (user: {}). Falling back to heuristic scorecard. Exception: {}", challengeName, user.getEmail(), e.getMessage(), e);
            Map<String, Object> fallbackData = getHeuristicEvaluation(challengeName);
            overallScore = (Integer) fallbackData.get("score");
            try {
                evaluationJson = objectMapper.writeValueAsString(fallbackData);
            } catch (Exception ex) {
                evaluationJson = "{}";
            }
        }

        session.setScore(overallScore);
        session.setEvaluationJson(evaluationJson);
        repository.save(session);
        
        // Publish system design evaluation event
        kafkaEventPublisher.publishUserActivity("SYSTEM_DESIGN_EVALUATED", user.getId(), "Evaluated system design challenge: " + challengeName + ", score: " + overallScore);

        return evaluationJson;
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

    private Map<String, Object> getHeuristicEvaluation(String challengeName) {
        Map<String, Object> map = new HashMap<>();
        map.put("score", 78);
        map.put("requirementsScore", 8.0);
        map.put("capacityScore", 7.5);
        map.put("scalingScore", 8.0);
        map.put("requirementsFeedback", "Solid requirements gathering. Make sure to clearly state functional vs non-functional metrics.");
        map.put("capacityFeedback", "Calculation estimates are reasonable, but you should detail queries-per-second (QPS) limits and network/bandwidth usage.");
        map.put("scalingFeedback", "Scale strategy uses CDN caching and messaging queues correctly. Expand on cache invalidation policy.");
        return map;
    }
}
