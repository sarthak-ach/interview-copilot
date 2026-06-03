package com.interviewcopilot.resumes;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.List;
import java.util.Map;

@Service
public class GeminiProvider implements AIProvider {

    private static final Logger logger = LoggerFactory.getLogger(GeminiProvider.class);
    private final RestClient restClient;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3-flash-preview}")
    private String model;

    public GeminiProvider() {
        this.restClient = RestClient.builder().build();
    }

    @Override
    public String generate(String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Gemini API key is not configured.");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> part = Map.of("parts", List.of(textPart));
        Map<String, Object> generationConfig = Map.of("responseMimeType", "application/json");

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(part),
                "generationConfig", generationConfig
        );

        try {
            JsonNode response = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(JsonNode.class);

            if (response != null && response.has("candidates")) {
                JsonNode candidates = response.get("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode content = candidates.get(0).get("content");
                    if (content != null && content.has("parts")) {
                        JsonNode parts = content.get("parts");
                        if (parts.isArray() && parts.size() > 0) {
                            return parts.get(0).get("text").asText();
                        }
                    }
                }
            }
            throw new RuntimeException("Unexpected response format from Gemini API");
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            logger.error("Gemini API error response body: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Gemini API error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            logger.error("Failed to generate content via Gemini API", e);
            throw new RuntimeException("Gemini generation failed: " + e.getMessage(), e);
        }
    }
}
