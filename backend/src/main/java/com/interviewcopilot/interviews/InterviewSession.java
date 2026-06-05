package com.interviewcopilot.interviews;

import com.interviewcopilot.users.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "interview_sessions", indexes = {
    @Index(name = "idx_int_sessions_user_id", columnList = "user_id, created_at")
})
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String category;

    private String difficulty;

    private String demeanor;

    private Integer score;

    @Column(name = "evaluation_json", columnDefinition = "TEXT")
    private String evaluationJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public InterviewSession() {
    }

    public InterviewSession(UUID id, User user, String category, String difficulty, String demeanor, Integer score, String evaluationJson, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.category = category;
        this.difficulty = difficulty;
        this.demeanor = demeanor;
        this.score = score;
        this.evaluationJson = evaluationJson;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getDemeanor() { return demeanor; }
    public void setDemeanor(String demeanor) { this.demeanor = demeanor; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public String getEvaluationJson() { return evaluationJson; }
    public void setEvaluationJson(String evaluationJson) { this.evaluationJson = evaluationJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
