package com.interviewcopilot.resumes;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class ResumeUploadListener {

    private static final Logger logger = LoggerFactory.getLogger(ResumeUploadListener.class);
    private final ResumeService resumeService;

    public ResumeUploadListener(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @KafkaListener(topics = "resume-uploads", groupId = "interview-copilot-group")
    public void consumeResumeUpload(String message) {
        logger.info("Received resume upload event for Resume ID: {}", message);
        try {
            UUID resumeId = UUID.fromString(message);
            resumeService.processUploadedResumeAsync(resumeId);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid UUID format in resume-uploads event: '{}'", message, e);
        } catch (Exception e) {
            logger.error("Error processing resume upload for Resume ID: {}", message, e);
        }
    }
}
