package com.interviewcopilot.applications;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {

    @PostMapping
    public ResponseEntity<?> createApplication(@Valid @RequestBody AppRequest request) {
        UUID mockAppId = UUID.randomUUID();
        return ResponseEntity.ok(Map.of(
                "id", mockAppId,
                "companyName", request.getCompanyName(),
                "roleName", request.getRoleName(),
                "status", request.getStatus(),
                "appliedDate", request.getAppliedDate() != null ? request.getAppliedDate() : LocalDate.now()
        ));
    }

    @GetMapping
    public ResponseEntity<List<?>> getApplications(@RequestParam UUID userId) {
        return ResponseEntity.ok(List.of(
                Map.of("id", UUID.randomUUID(), "companyName", "Stripe", "roleName", "Full Stack Engineer", "status", "Technical Round"),
                Map.of("id", UUID.randomUUID(), "companyName", "Atlassian", "roleName", "Senior Java Developer", "status", "Phone Screen")
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateApplication(@PathVariable UUID id, @Valid @RequestBody UpdateAppRequest request) {
        return ResponseEntity.ok(Map.of(
                "id", id,
                "status", request.getStatus(),
                "notes", request.getNotes() != null ? request.getNotes() : "Updated notes stub"
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApplication(@PathVariable UUID id) {
        return ResponseEntity.ok(Map.of(
                "id", id,
                "message", "Application deleted successfully"
        ));
    }

    public static class AppRequest {
        @NotNull
        private UUID userId;
        @NotBlank
        private String companyName;
        @NotBlank
        private String roleName;
        @NotBlank
        private String status;
        private LocalDate appliedDate;

        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }

        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }

        public String getRoleName() { return roleName; }
        public void setRoleName(String roleName) { this.roleName = roleName; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public LocalDate getAppliedDate() { return appliedDate; }
        public void setAppliedDate(LocalDate appliedDate) { this.appliedDate = appliedDate; }
    }

    public static class UpdateAppRequest {
        @NotBlank
        private String status;
        private String notes;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}
