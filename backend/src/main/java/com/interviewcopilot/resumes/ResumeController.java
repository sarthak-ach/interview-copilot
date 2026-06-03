package com.interviewcopilot.resumes;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(origins = "*")
public class ResumeController {

    private final ResumeService resumeService;
    private final ObjectMapper objectMapper;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file, @RequestParam("userId") UUID userId) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File cannot be empty");
        }

        try {
            Resume resume = resumeService.uploadResume(file, userId);
            return ResponseEntity.ok(Map.of(
                    "id", resume.getId(),
                    "filename", resume.getFileUrl(),
                    "status", "COMPLETED",
                    "message", "Resume uploaded and analyzed successfully."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getResumes(@RequestParam UUID userId) {
        List<Resume> resumes = resumeService.getResumesByUserId(userId);
        List<Map<String, Object>> result = resumes.stream().map(r -> {
            Optional<ResumeReview> revOpt = resumeService.getResumeReviewByResumeId(r.getId());
            int score = revOpt.map(ResumeReview::getScore).orElse(0);
            
            // Extract display filename (safe unique prefix is 37 characters)
            String displayFilename = r.getFileUrl();
            if (displayFilename != null && displayFilename.length() > 37) {
                displayFilename = displayFilename.substring(37);
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("filename", displayFilename);
            map.put("score", score);
            map.put("uploadedAt", r.getUploadedAt());
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getResumeById(@PathVariable UUID id) {
        Resume resume = resumeService.getResumeById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found"));
        
        String displayFilename = resume.getFileUrl();
        if (displayFilename != null && displayFilename.length() > 37) {
            displayFilename = displayFilename.substring(37);
        }

        return ResponseEntity.ok(Map.of(
                "id", resume.getId(),
                "filename", displayFilename,
                "parsedContent", resume.getParsedContent(),
                "uploadedAt", resume.getUploadedAt()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(@PathVariable UUID id) {
        try {
            resumeService.deleteResume(id);
            return ResponseEntity.ok(Map.of("message", "Resume deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Delete failed: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/review")
    public ResponseEntity<?> getResumeReview(@PathVariable UUID id) {
        ResumeReview review = resumeService.getResumeReviewByResumeId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume review not found"));

        try {
            JsonNode rootNode = objectMapper.readTree(review.getReviewJson());
            return ResponseEntity.ok(rootNode);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to parse review details: " + e.getMessage());
        }
    }
}
