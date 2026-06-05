package com.interviewcopilot.resumes;

import com.interviewcopilot.jobs.JobDescription;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tailored_resumes", indexes = {
    @Index(name = "idx_tailored_resumes_resume_id", columnList = "resume_id"),
    @Index(name = "idx_tailored_resumes_jd_id", columnList = "job_description_id")
})
public class TailoredResume {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_description_id", nullable = false)
    private JobDescription jobDescription;

    @Column(name = "tailored_at", nullable = false)
    private LocalDateTime tailoredAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tailored_json", columnDefinition = "jsonb")
    private String tailoredJson;

    public TailoredResume() {
    }

    public TailoredResume(UUID id, Resume resume, JobDescription jobDescription, LocalDateTime tailoredAt, String tailoredJson) {
        this.id = id;
        this.resume = resume;
        this.jobDescription = jobDescription;
        this.tailoredAt = tailoredAt;
        this.tailoredJson = tailoredJson;
    }

    @PrePersist
    protected void onCreate() {
        this.tailoredAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public JobDescription getJobDescription() { return jobDescription; }
    public void setJobDescription(JobDescription jobDescription) { this.jobDescription = jobDescription; }

    public LocalDateTime getTailoredAt() { return tailoredAt; }
    public void setTailoredAt(LocalDateTime tailoredAt) { this.tailoredAt = tailoredAt; }

    public String getTailoredJson() { return tailoredJson; }
    public void setTailoredJson(String tailoredJson) { this.tailoredJson = tailoredJson; }
}
