package com.interviewcopilot.codeeditor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewcopilot.common.KafkaEventPublisher;
import com.interviewcopilot.resumes.GeminiProvider;
import com.interviewcopilot.users.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class CodeDraftService {

    private static final Logger logger = LoggerFactory.getLogger(CodeDraftService.class);
    private final CodeDraftRepository repository;
    private final GeminiProvider geminiProvider;
    private final KafkaEventPublisher kafkaEventPublisher;
    private final ObjectMapper objectMapper;

    public CodeDraftService(CodeDraftRepository repository,
                            GeminiProvider geminiProvider,
                            KafkaEventPublisher kafkaEventPublisher) {
        this.repository = repository;
        this.geminiProvider = geminiProvider;
        this.kafkaEventPublisher = kafkaEventPublisher;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public CodeDraft getOrCreateDraft(User user, String challengeName, String language) {
        Optional<CodeDraft> existing = repository.findByUserIdAndChallengeNameAndLanguage(user.getId(), challengeName, language);
        if (existing.isPresent()) {
            return existing.get();
        }

        CodeDraft draft = new CodeDraft();
        draft.setUser(user);
        draft.setChallengeName(challengeName);
        draft.setLanguage(language);
        draft.setCode("");
        draft.setUpdatedAt(LocalDateTime.now());

        return repository.save(draft);
    }

    @Transactional
    public CodeDraft saveDraft(User user, String challengeName, String language, String code) {
        CodeDraft draft = getOrCreateDraft(user, challengeName, language);
        draft.setCode(code != null ? code : "");
        draft.setUpdatedAt(LocalDateTime.now());
        return repository.save(draft);
    }

    @Transactional
    public String evaluateCode(User user, String challengeName, String language, String code) {
        saveDraft(user, challengeName, language, code);

        String prompt;
        if ("Custom Sandbox".equalsIgnoreCase(challengeName)) {
            prompt = String.format(
                    "You are a Senior Software Engineer conducting a code review of a candidate's custom playground code.\n" +
                    "Programming Language: %s\n\n" +
                    "Here is the candidate's code:\n" +
                    "```%s\n" +
                    "%s\n" +
                    "```\n\n" +
                    "Analyze the code structure, comments, or class/function names to identify what it is attempting to do (or review it generally if it's snippet-based).\n" +
                    "Determine if there are logical errors, edge cases ignored, syntax syntax issues, or potential complexity optimizations (Time & Space).\n\n" +
                    "You MUST output ONLY a valid JSON object matching the following structure. Do not include markdown backticks or extra text outside the JSON:\n" +
                    "{\n" +
                    "  \"score\": 85, // Integer score out of 100 based on code quality, correctness, and structure\n" +
                    "  \"status\": \"PASS\", // 'PASS' if there are no major bugs, 'WARNING' if it has optimizations needed, or 'FAIL' if syntax/logic errors exist\n" +
                    "  \"complexity\": {\n" +
                    "    \"time\": \"O(N)\", // Estimated time complexity or 'N/A'\n" +
                    "    \"space\": \"O(1)\" // Estimated space complexity or 'N/A'\n" +
                    "  },\n" +
                    "  \"feedback\": \"Constructive feedback detailing what the code achieves, its strengths, and potential issues...\",\n" +
                    "  \"suggestions\": [\"Concrete recommendation 1\", \"Concrete recommendation 2\"],\n" +
                    "  \"testCases\": [\n" +
                    "    { \"input\": \"Dynamic input test\", \"expected\": \"Expected output\", \"actual\": \"Actual output based on code analysis\", \"passed\": true }\n" +
                    "  ]\n" +
                    "}",
                    language,
                    language.toLowerCase(),
                    code
            );
        } else {
            prompt = String.format(
                    "You are a technical coding interviewer evaluating a candidate's solution to a coding challenge.\n" +
                    "Challenge Name: %s\n" +
                    "Programming Language: %s\n\n" +
                    "Here is the candidate's code:\n" +
                    "```%s\n" +
                    "%s\n" +
                    "```\n\n" +
                    "Evaluate the solution for correctness against standard test cases of '%s', edge cases, and performance.\n\n" +
                    "You MUST output ONLY a valid JSON object matching the following structure. Do not include markdown backticks or extra text outside the JSON:\n" +
                    "{\n" +
                    "  \"score\": 90, // Cumulative score out of 100\n" +
                    "  \"status\": \"PASS\", // 'PASS', 'WARNING', or 'FAIL'\n" +
                    "  \"complexity\": {\n" +
                    "    \"time\": \"O(N)\", // Estimated runtime complexity\n" +
                    "    \"space\": \"O(N)\" // Estimated auxiliary space complexity\n" +
                    "  },\n" +
                    "  \"feedback\": \"Constructive critique of the algorithm chosen and coding style...\",\n" +
                    "  \"suggestions\": [\"Use a Map to speed up lookup\", \"Add input length boundary checks\"],\n" +
                    "  \"testCases\": [\n" +
                    "    { \"input\": \"Example input 1\", \"expected\": \"Example expected\", \"actual\": \"Observed output from dry-run\", \"passed\": true },\n" +
                    "    { \"input\": \"Edge case / Empty input\", \"expected\": \"Expected error/fallback\", \"actual\": \"Observed output\", \"passed\": false }\n" +
                    "  ]\n" +
                    "}",
                    challengeName,
                    language,
                    language.toLowerCase(),
                    code,
                    challengeName
            );
        }

        String evaluationJson;
        int score = 80;

        try {
            String rawJson = geminiProvider.generate(prompt);
            evaluationJson = extractJson(rawJson);
            JsonNode node = objectMapper.readTree(evaluationJson);
            if (node.has("score")) {
                score = node.get("score").asInt();
            }
        } catch (Exception e) {
            logger.error("Gemini failed to evaluate coding draft for challenge '{}' (user: {}). Exception: {}", challengeName, user.getEmail(), e.getMessage(), e);
            // Fallback JSON scorecard
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("score", 70);
            fallback.put("status", "WARNING");
            fallback.put("complexity", Map.of("time", "Unknown", "space", "Unknown"));
            fallback.put("feedback", "AI evaluation failed to parse code successfully. Please check syntax and submit again.");
            fallback.put("suggestions", java.util.List.of("Verify your code doesn't contain major compilation errors.", "Ensure proper return statements."));
            fallback.put("testCases", java.util.List.of(Map.of("input", "N/A", "expected", "N/A", "actual", "N/A", "passed", true)));
            try {
                evaluationJson = objectMapper.writeValueAsString(fallback);
            } catch (Exception ex) {
                evaluationJson = "{}";
            }
        }

        // Publish event to Kafka
        kafkaEventPublisher.publishUserActivity("CODE_DRAFT_EVALUATED", user.getId(),
                "Evaluated code for challenge: " + challengeName + " (" + language + "), score: " + score);

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
}
