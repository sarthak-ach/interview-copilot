package com.interviewcopilot.jobs;

import com.interviewcopilot.resumes.Resume;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "job_matches", indexes = {
    @Index(name = "idx_job_matches_resume_id", columnList = "resume_id"),
    @Index(name = "idx_job_matches_jd_id", columnList = "job_description_id")
})
public class JobMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_description_id", nullable = false)
    private JobDescription jobDescription;

    @Column(name = "match_score", nullable = false)
    private Integer matchScore;

    @Column(name = "analysis_json", columnDefinition = "jsonb")
    private String analysisJson;

    public JobMatch() {
    }

    public JobMatch(UUID id, Resume resume, JobDescription jobDescription, Integer matchScore, String analysisJson) {
        this.id = id;
        this.resume = resume;
        this.jobDescription = jobDescription;
        this.matchScore = matchScore;
        this.analysisJson = analysisJson;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public JobDescription getJobDescription() { return jobDescription; }
    public void setJobDescription(JobDescription jobDescription) { this.jobDescription = jobDescription; }

    public Integer getMatchScore() { return matchScore; }
    public void setMatchScore(Integer matchScore) { this.matchScore = matchScore; }

    public String getAnalysisJson() { return analysisJson; }
    public void setAnalysisJson(String analysisJson) { this.analysisJson = analysisJson; }
}
