package com.interviewcopilot.resumes;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(origins = "*")
public class ResumeController {

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file, @RequestParam("userId") UUID userId) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File cannot be empty");
        }
        
        // Stub implementation simulating resume parsing and db saving
        UUID mockResumeId = UUID.randomUUID();
        return ResponseEntity.ok(Map.of(
                "id", mockResumeId,
                "filename", file.getOriginalFilename(),
                "status", "PENDING",
                "message", "Resume uploaded successfully, analysis job enqueued."
        ));
    }

    @GetMapping
    public ResponseEntity<List<?>> getResumes(@RequestParam UUID userId) {
        // Return stubbed metadata list
        return ResponseEntity.ok(List.of(
                Map.of("id", UUID.randomUUID(), "filename", "Sarthak_Resume_FullStack.pdf", "score", 82),
                Map.of("id", UUID.randomUUID(), "filename", "Sarthak_Resume_Backend.pdf", "score", 89)
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getResumeById(@PathVariable UUID id) {
        return ResponseEntity.ok(Map.of(
                "id", id,
                "filename", "Uploaded_Resume.pdf",
                "parsedContent", "Extracted skills text summary..."
        ));
    }

    @GetMapping("/{id}/review")
    public ResponseEntity<?> getResumeReview(@PathVariable UUID id) {
        return ResponseEntity.ok(Map.of(
                "resumeId", id,
                "score", 82,
                "strengths", List.of("Spring Boot", "React performance"),
                "weaknesses", List.of("Needs caching references"),
                "missingKeywords", List.of("Kafka", "Redis")
        ));
    }
}
