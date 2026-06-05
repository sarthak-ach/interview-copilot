package com.interviewcopilot.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class KafkaEventPublisher {

    private static final Logger logger = LoggerFactory.getLogger(KafkaEventPublisher.class);
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public KafkaEventPublisher(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
    }

    public void publishEvent(String topic, String key, String value) {
        try {
            logger.info("Publishing event to topic '{}' with key '{}'", topic, key);
            kafkaTemplate.send(topic, key, value);
        } catch (Exception e) {
            logger.error("Failed to publish event to topic '{}': {}", topic, e.getMessage(), e);
        }
    }

    public void publishUserActivity(String activityType, UUID userId, String details) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("activityType", activityType);
            payload.put("userId", userId.toString());
            payload.put("details", details);
            payload.put("timestamp", System.currentTimeMillis());

            String jsonValue = objectMapper.writeValueAsString(payload);
            publishEvent("user-activity", userId.toString(), jsonValue);
        } catch (Exception e) {
            logger.error("Failed to publish user activity event: {}", e.getMessage(), e);
        }
    }
}
