package com.interviewcopilot.applications;

import com.interviewcopilot.users.User;
import com.interviewcopilot.resumes.Resume;
import com.interviewcopilot.jobs.JobDescription;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "applications", indexes = {
    @Index(name = "idx_applications_user_status", columnList = "user_id, status")
})
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "role_name", nullable = false)
    private String roleName;

    @Column(nullable = false)
    private String status; // "Saved", "Applied", "Phone Screen", "Technical Round", "Offer", "Rejected"

    @Column(name = "applied_date")
    private LocalDate appliedDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_description_id")
    private JobDescription jobDescription;

    @Column(name = "match_score")
    private Integer matchScore;

    public Application() {
    }

    public Application(UUID id, User user, String companyName, String roleName, String status, LocalDate appliedDate) {
        this.id = id;
        this.user = user;
        this.companyName = companyName;
        this.roleName = roleName;
        this.status = status;
        this.appliedDate = appliedDate;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public JobDescription getJobDescription() { return jobDescription; }
    public void setJobDescription(JobDescription jobDescription) { this.jobDescription = jobDescription; }

    public Integer getMatchScore() { return matchScore; }
    public void setMatchScore(Integer matchScore) { this.matchScore = matchScore; }
}
