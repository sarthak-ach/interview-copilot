package com.interviewcopilot.resumes;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "resume_reviews", indexes = {
    @Index(name = "idx_resume_reviews_resume_id", columnList = "resume_id")
})
public class ResumeReview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "review_json", columnDefinition = "jsonb")
    private String reviewJson;

    public ResumeReview() {
    }

    public ResumeReview(UUID id, Resume resume, Integer score, String reviewJson) {
        this.id = id;
        this.resume = resume;
        this.score = score;
        this.reviewJson = reviewJson;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public String getReviewJson() { return reviewJson; }
    public void setReviewJson(String reviewJson) { this.reviewJson = reviewJson; }
}
