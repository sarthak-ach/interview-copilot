package com.interviewcopilot.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class ActivityLogger {

    private static final Logger logger = LoggerFactory.getLogger(ActivityLogger.class);
    private final ObjectMapper objectMapper;

    public ActivityLogger() {
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(topics = "user-activity", groupId = "interview-copilot-group")
    public void consumeUserActivity(String message) {
        try {
            JsonNode payload = objectMapper.readTree(message);
            String activityType = payload.path("activityType").asText("UNKNOWN");
            String userId = payload.path("userId").asText("UNKNOWN_USER");
            String details = payload.path("details").asText("");
            long timestamp = payload.path("timestamp").asLong(0);

            logger.info("[AUDIT TRAIL] Timestamp: {} | User ID: {} | Action: {} | Details: {}",
                    timestamp, userId, activityType, details);
        } catch (Exception e) {
            logger.error("Failed to parse and log user activity message: {}", e.getMessage(), e);
        }
    }
}
