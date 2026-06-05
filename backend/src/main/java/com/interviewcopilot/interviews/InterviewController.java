package com.interviewcopilot.interviews;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewcopilot.users.User;
import com.interviewcopilot.users.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
@CrossOrigin(origins = "*")
public class InterviewController {

    private final InterviewService interviewService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public InterviewController(InterviewService interviewService, UserRepository userRepository) {
        this.interviewService = interviewService;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping("/start")
    public ResponseEntity<?> startSession(@Valid @RequestBody StartSessionRequest request) {
        // Retrieve authenticated user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            // Fallback to request userId if auth fails or is mock
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        }

        InterviewSession session = interviewService.startSession(
                user,
                request.getCategory(),
                request.getDifficulty() != null ? request.getDifficulty() : "Senior",
                request.getInterviewerStyle()
        );

        // Fetch the generated first question (from message table)
        List<InterviewMessage> messages = interviewService.getMessages(session.getId());
        String firstQuestion = messages.isEmpty() ? "Welcome! Let's start." : messages.get(0).getContent();

        return ResponseEntity.ok(Map.of(
                "id", session.getId(),
                "category", session.getCategory(),
                "difficulty", session.getDifficulty(),
                "interviewerStyle", session.getDemeanor(),
                "firstQuestion", firstQuestion
        ));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable UUID id, @Valid @RequestBody MessageRequest request) {
        try {
            InterviewMessage aiResponse = interviewService.handleUserResponse(id, request.getContent());
            return ResponseEntity.ok(Map.of(
                    "sessionId", id,
                    "role", "AI",
                    "content", aiResponse.getContent()
            ));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @PostMapping("/{id}/evaluate")
    public ResponseEntity<?> evaluateSession(@PathVariable UUID id) {
        try {
            String evaluationJson = interviewService.evaluateSession(id);
            return ResponseEntity.ok(objectMapper.readTree(evaluationJson));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Evaluation failed: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSession(@PathVariable UUID id) {
        InterviewSession session = interviewService.getSession(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        
        List<InterviewMessage> messages = interviewService.getMessages(id);
        List<Map<String, String>> mappedMessages = messages.stream().map(m -> Map.of(
                "role", m.getRole(),
                "content", m.getContent()
        )).toList();

        return ResponseEntity.ok(Map.of(
                "id", session.getId(),
                "category", session.getCategory(),
                "difficulty", session.getDifficulty(),
                "interviewerStyle", session.getDemeanor(),
                "score", session.getScore() != null ? session.getScore() : 0,
                "evaluationJson", session.getEvaluationJson() != null ? session.getEvaluationJson() : "",
                "messages", mappedMessages
        ));
    }

    public static class StartSessionRequest {
        @NotNull
        private UUID userId;
        @NotBlank
        private String category;
        @NotBlank
        private String interviewerStyle;
        
        private String difficulty;

        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getInterviewerStyle() { return interviewerStyle; }
        public void setInterviewerStyle(String interviewerStyle) { this.interviewerStyle = interviewerStyle; }

        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    }

    public static class MessageRequest {
        @NotBlank
        private String content;

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
