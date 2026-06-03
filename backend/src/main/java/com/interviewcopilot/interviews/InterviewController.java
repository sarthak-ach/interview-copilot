package com.interviewcopilot.interviews;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
@CrossOrigin(origins = "*")
public class InterviewController {

    @PostMapping("/start")
    public ResponseEntity<?> startSession(@Valid @RequestBody StartSessionRequest request) {
        UUID mockSessionId = UUID.randomUUID();
        return ResponseEntity.ok(Map.of(
                "id", mockSessionId,
                "category", request.getCategory(),
                "interviewerStyle", request.getInterviewerStyle(),
                "firstQuestion", "Explain how you would avoid N+1 queries in a Spring Boot service."
        ));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable UUID id, @Valid @RequestBody MessageRequest request) {
        String aiResponse = "Interesting points. Can you detail how you would handle connection pooling or caching for that scenario?";
        return ResponseEntity.ok(Map.of(
                "sessionId", id,
                "role", "AI",
                "content", aiResponse
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSession(@PathVariable UUID id) {
        return ResponseEntity.ok(Map.of(
                "id", id,
                "category", "Spring Boot",
                "score", 8,
                "messages", List.of(
                        Map.of("role", "AI", "content", "How do you handle N+1 select loops?"),
                        Map.of("role", "USER", "content", "Using FetchJoins or EntityGraphs.")
                )
        ));
    }

    public static class StartSessionRequest {
        @NotNull
        private UUID userId;
        @NotBlank
        private String category;
        @NotBlank
        private String interviewerStyle;

        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getInterviewerStyle() { return interviewerStyle; }
        public void setInterviewerStyle(String interviewerStyle) { this.interviewerStyle = interviewerStyle; }
    }

    public static class MessageRequest {
        @NotBlank
        private String content;

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
