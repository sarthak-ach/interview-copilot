package com.interviewcopilot.jobs;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class JobController {

    @PostMapping("/descriptions")
    public ResponseEntity<?> createJobDescription(@Valid @RequestBody JobDescRequest request) {
        UUID mockJdId = UUID.randomUUID();
        return ResponseEntity.ok(Map.of(
                "id", mockJdId,
                "title", request.getTitle(),
                "message", "Job Description stored successfully"
        ));
    }

    @PostMapping("/matches")
    public ResponseEntity<?> matchResume(@Valid @RequestBody MatchRequest request) {
        return ResponseEntity.ok(Map.of(
                "id", UUID.randomUUID(),
                "resumeId", request.getResumeId(),
                "jobDescriptionId", request.getJobDescriptionId(),
                "matchScore", 84,
                "strongMatches", List.of("React component design", "Java REST APIs using Spring Boot"),
                "missingSkills", List.of("OAuth2 security", "Redis caches"),
                "recommendations", List.of("Explicitly detail containerization experience using Docker.")
        ));
    }

    public static class JobDescRequest {
        @NotNull
        private UUID userId;
        @NotBlank
        private String title;
        @NotBlank
        private String description;

        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class MatchRequest {
        @NotNull
        private UUID resumeId;
        @NotNull
        private UUID jobDescriptionId;

        public UUID getResumeId() { return resumeId; }
        public void setResumeId(UUID resumeId) { this.resumeId = resumeId; }

        public UUID getJobDescriptionId() { return jobDescriptionId; }
        public void setJobDescriptionId(UUID jobDescriptionId) { this.jobDescriptionId = jobDescriptionId; }
    }
}
