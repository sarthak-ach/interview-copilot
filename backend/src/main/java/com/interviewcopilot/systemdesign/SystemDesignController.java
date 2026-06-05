package com.interviewcopilot.systemdesign;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewcopilot.users.User;
import com.interviewcopilot.users.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/system-design")
@CrossOrigin(origins = "*")
public class SystemDesignController {

    private final SystemDesignService systemDesignService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public SystemDesignController(SystemDesignService systemDesignService, UserRepository userRepository) {
        this.systemDesignService = systemDesignService;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getSession(@RequestParam String challengeName) {
        User user = getAuthenticatedUser();
        SystemDesignSession session = systemDesignService.getOrCreateSession(user, challengeName);
        
        return ResponseEntity.ok(Map.of(
                "id", session.getId(),
                "challengeName", session.getChallengeName(),
                "requirementsDraft", session.getRequirementsDraft() != null ? session.getRequirementsDraft() : "",
                "capacityDraft", session.getCapacityDraft() != null ? session.getCapacityDraft() : "",
                "apisDraft", session.getApisDraft() != null ? session.getApisDraft() : "",
                "schemaDraft", session.getSchemaDraft() != null ? session.getSchemaDraft() : "",
                "scalingDraft", session.getScalingDraft() != null ? session.getScalingDraft() : "",
                "score", session.getScore() != null ? session.getScore() : 0,
                "evaluationJson", session.getEvaluationJson() != null ? session.getEvaluationJson() : ""
        ));
    }

    @PostMapping("/sessions/save")
    public ResponseEntity<?> saveDraft(@Valid @RequestBody SaveDraftRequest request) {
        User user = getAuthenticatedUser();
        SystemDesignSession session = systemDesignService.saveDraft(
                user,
                request.getChallengeName(),
                request.getRequirementsDraft(),
                request.getCapacityDraft(),
                request.getApisDraft(),
                request.getSchemaDraft(),
                request.getScalingDraft()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Draft saved successfully",
                "updatedAt", session.getUpdatedAt()
        ));
    }

    @PostMapping("/sessions/evaluate")
    public ResponseEntity<?> evaluateSession(@Valid @RequestBody EvaluateRequest request) {
        User user = getAuthenticatedUser();
        try {
            String evaluationJson = systemDesignService.evaluateSession(user, request.getChallengeName());
            return ResponseEntity.ok(objectMapper.readTree(evaluationJson));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("System design evaluation failed: " + e.getMessage());
        }
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated"));
    }

    public static class SaveDraftRequest {
        @NotBlank
        private String challengeName;
        private String requirementsDraft;
        private String capacityDraft;
        private String apisDraft;
        private String schemaDraft;
        private String scalingDraft;

        public String getChallengeName() { return challengeName; }
        public void setChallengeName(String challengeName) { this.challengeName = challengeName; }

        public String getRequirementsDraft() { return requirementsDraft; }
        public void setRequirementsDraft(String requirementsDraft) { this.requirementsDraft = requirementsDraft; }

        public String getCapacityDraft() { return capacityDraft; }
        public void setCapacityDraft(String capacityDraft) { this.capacityDraft = capacityDraft; }

        public String getApisDraft() { return apisDraft; }
        public void setApisDraft(String apisDraft) { this.apisDraft = apisDraft; }

        public String getSchemaDraft() { return schemaDraft; }
        public void setSchemaDraft(String schemaDraft) { this.schemaDraft = schemaDraft; }

        public String getScalingDraft() { return scalingDraft; }
        public void setScalingDraft(String scalingDraft) { this.scalingDraft = scalingDraft; }
    }

    @PostMapping("/sessions/evaluate-diagram")
    public ResponseEntity<?> evaluateDiagram(@Valid @RequestBody EvaluateDiagramRequest request) {
        User user = getAuthenticatedUser();
        try {
            String evaluationJson = systemDesignService.evaluateDiagram(
                    user,
                    request.getChallengeName(),
                    request.getNodes(),
                    request.getLinks()
            );
            return ResponseEntity.ok(objectMapper.readTree(evaluationJson));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("System design diagram evaluation failed: " + e.getMessage());
        }
    }

    public static class EvaluateDiagramRequest {
        @NotBlank
        private String challengeName;
        private List<Map<String, String>> nodes;
        private List<Map<String, String>> links;

        public String getChallengeName() { return challengeName; }
        public void setChallengeName(String challengeName) { this.challengeName = challengeName; }

        public List<Map<String, String>> getNodes() { return nodes; }
        public void setNodes(List<Map<String, String>> nodes) { this.nodes = nodes; }

        public List<Map<String, String>> getLinks() { return links; }
        public void setLinks(List<Map<String, String>> links) { this.links = links; }
    }

    public static class EvaluateRequest {
        @NotBlank
        private String challengeName;

        public String getChallengeName() { return challengeName; }
        public void setChallengeName(String challengeName) { this.challengeName = challengeName; }
    }
}
