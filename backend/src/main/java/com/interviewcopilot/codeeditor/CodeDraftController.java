package com.interviewcopilot.codeeditor;

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

import java.util.Map;

@RestController
@RequestMapping("/api/code-editor")
@CrossOrigin(origins = "*")
public class CodeDraftController {

    private final CodeDraftService codeDraftService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public CodeDraftController(CodeDraftService codeDraftService, UserRepository userRepository) {
        this.codeDraftService = codeDraftService;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    @GetMapping("/draft")
    public ResponseEntity<?> getDraft(@RequestParam String challengeName, @RequestParam String language) {
        User user = getAuthenticatedUser();
        CodeDraft draft = codeDraftService.getOrCreateDraft(user, challengeName, language);
        return ResponseEntity.ok(Map.of(
                "id", draft.getId(),
                "challengeName", draft.getChallengeName(),
                "language", draft.getLanguage(),
                "code", draft.getCode(),
                "updatedAt", draft.getUpdatedAt()
        ));
    }

    @PostMapping("/draft/save")
    public ResponseEntity<?> saveDraft(@Valid @RequestBody SaveDraftRequest request) {
        User user = getAuthenticatedUser();
        CodeDraft draft = codeDraftService.saveDraft(
                user,
                request.getChallengeName(),
                request.getLanguage(),
                request.getCode()
        );
        return ResponseEntity.ok(Map.of(
                "message", "Draft saved successfully",
                "updatedAt", draft.getUpdatedAt()
        ));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<?> evaluateCode(@Valid @RequestBody EvaluateRequest request) {
        User user = getAuthenticatedUser();
        try {
            String evaluationJson = codeDraftService.evaluateCode(
                    user,
                    request.getChallengeName(),
                    request.getLanguage(),
                    request.getCode()
            );
            return ResponseEntity.ok(objectMapper.readTree(evaluationJson));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Code evaluation failed: " + e.getMessage());
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
        @NotBlank
        private String language;
        private String code;

        public String getChallengeName() {
            return challengeName;
        }

        public void setChallengeName(String challengeName) {
            this.challengeName = challengeName;
        }

        public String getLanguage() {
            return language;
        }

        public void setLanguage(String language) {
            this.language = language;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }
    }

    public static class EvaluateRequest {
        @NotBlank
        private String challengeName;
        @NotBlank
        private String language;
        private String code;

        public String getChallengeName() {
            return challengeName;
        }

        public void setChallengeName(String challengeName) {
            this.challengeName = challengeName;
        }

        public String getLanguage() {
            return language;
        }

        public void setLanguage(String language) {
            this.language = language;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }
    }
}
