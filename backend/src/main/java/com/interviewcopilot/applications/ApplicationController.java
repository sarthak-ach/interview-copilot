package com.interviewcopilot.applications;

import com.interviewcopilot.users.User;
import com.interviewcopilot.users.UserRepository;
import com.interviewcopilot.resumes.Resume;
import com.interviewcopilot.resumes.ResumeRepository;
import com.interviewcopilot.jobs.JobDescription;
import com.interviewcopilot.jobs.JobDescriptionRepository;
import com.interviewcopilot.jobs.JobMatch;
import com.interviewcopilot.jobs.JobMatchRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final JobMatchRepository jobMatchRepository;

    public ApplicationController(ApplicationRepository applicationRepository,
                                 UserRepository userRepository,
                                 ResumeRepository resumeRepository,
                                 JobDescriptionRepository jobDescriptionRepository,
                                 JobMatchRepository jobMatchRepository) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.jobDescriptionRepository = jobDescriptionRepository;
        this.jobMatchRepository = jobMatchRepository;
    }

    @PostMapping
    public ResponseEntity<?> createApplication(@Valid @RequestBody AppRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Application app = new Application();
        app.setUser(user);
        app.setCompanyName(request.getCompanyName());
        app.setRoleName(request.getRoleName());
        app.setStatus(request.getStatus());
        app.setAppliedDate(request.getAppliedDate() != null ? request.getAppliedDate() : LocalDate.now());
        app.setNotes(request.getNotes());

        if (request.getResumeId() != null) {
            Resume resume = resumeRepository.findById(request.getResumeId()).orElse(null);
            app.setResume(resume);
        }
        if (request.getJobDescriptionId() != null) {
            JobDescription jd = jobDescriptionRepository.findById(request.getJobDescriptionId()).orElse(null);
            app.setJobDescription(jd);
        }

        // Auto-resolve match score if a match is present
        if (app.getResume() != null && app.getJobDescription() != null) {
            Optional<JobMatch> matchOpt = jobMatchRepository.findByResumeIdAndJobDescriptionId(
                    app.getResume().getId(), app.getJobDescription().getId());
            if (matchOpt.isPresent()) {
                app.setMatchScore(matchOpt.get().getMatchScore());
            }
        }

        Application savedApp = applicationRepository.save(app);
        return ResponseEntity.ok(mapApplicationToResponse(savedApp));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getApplications(@RequestParam UUID userId) {
        List<Application> apps = applicationRepository.findByUserId(userId);
        List<Map<String, Object>> response = apps.stream()
                .map(this::mapApplicationToResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateApplication(@PathVariable UUID id, @Valid @RequestBody UpdateAppRequest request) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (request.getStatus() != null) {
            app.setStatus(request.getStatus());
        }
        if (request.getNotes() != null) {
            app.setNotes(request.getNotes());
        }

        if (request.getResumeId() != null) {
            Resume resume = resumeRepository.findById(request.getResumeId()).orElse(null);
            app.setResume(resume);
        } else if (request.isClearResume()) {
            app.setResume(null);
            app.setMatchScore(null);
        }

        if (request.getJobDescriptionId() != null) {
            JobDescription jd = jobDescriptionRepository.findById(request.getJobDescriptionId()).orElse(null);
            app.setJobDescription(jd);
        } else if (request.isClearJobDescription()) {
            app.setJobDescription(null);
            app.setMatchScore(null);
        }

        // Re-resolve match score
        if (app.getResume() != null && app.getJobDescription() != null) {
            Optional<JobMatch> matchOpt = jobMatchRepository.findByResumeIdAndJobDescriptionId(
                    app.getResume().getId(), app.getJobDescription().getId());
            if (matchOpt.isPresent()) {
                app.setMatchScore(matchOpt.get().getMatchScore());
            } else {
                // If linked but match analysis has not run, default to a heuristic score or trigger/store 75
                app.setMatchScore(75);
            }
        } else {
            app.setMatchScore(null);
        }

        app = applicationRepository.save(app);
        return ResponseEntity.ok(mapApplicationToResponse(app));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApplication(@PathVariable UUID id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        applicationRepository.delete(app);
        return ResponseEntity.ok(Map.of(
                "id", id,
                "message", "Application deleted successfully"
        ));
    }

    private Map<String, Object> mapApplicationToResponse(Application app) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", app.getId());
        map.put("companyName", app.getCompanyName());
        map.put("roleName", app.getRoleName());
        map.put("status", app.getStatus());
        map.put("appliedDate", app.getAppliedDate());
        map.put("notes", app.getNotes() != null ? app.getNotes() : "");
        map.put("matchScore", app.getMatchScore());

        if (app.getResume() != null) {
            map.put("resumeId", app.getResume().getId());
            String displayFilename = app.getResume().getFileUrl();
            if (displayFilename != null && displayFilename.length() > 37) {
                displayFilename = displayFilename.substring(37);
            }
            map.put("resumeFilename", displayFilename);
        } else {
            map.put("resumeId", null);
            map.put("resumeFilename", null);
        }

        if (app.getJobDescription() != null) {
            map.put("jobDescriptionId", app.getJobDescription().getId());
            map.put("jobDescriptionTitle", app.getJobDescription().getTitle());
        } else {
            map.put("jobDescriptionId", null);
            map.put("jobDescriptionTitle", null);
        }

        return map;
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
        private String notes;
        private UUID resumeId;
        private UUID jobDescriptionId;

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

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public UUID getResumeId() { return resumeId; }
        public void setResumeId(UUID resumeId) { this.resumeId = resumeId; }

        public UUID getJobDescriptionId() { return jobDescriptionId; }
        public void setJobDescriptionId(UUID jobDescriptionId) { this.jobDescriptionId = jobDescriptionId; }
    }

    public static class UpdateAppRequest {
        private String status;
        private String notes;
        private UUID resumeId;
        private UUID jobDescriptionId;
        private boolean clearResume;
        private boolean clearJobDescription;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public UUID getResumeId() { return resumeId; }
        public void setResumeId(UUID resumeId) { this.resumeId = resumeId; }

        public UUID getJobDescriptionId() { return jobDescriptionId; }
        public void setJobDescriptionId(UUID jobDescriptionId) { this.jobDescriptionId = jobDescriptionId; }

        public boolean isClearResume() { return clearResume; }
        public void setClearResume(boolean clearResume) { this.clearResume = clearResume; }

        public boolean isClearJobDescription() { return clearJobDescription; }
        public void setClearJobDescription(boolean clearJobDescription) { this.clearJobDescription = clearJobDescription; }
    }
}
