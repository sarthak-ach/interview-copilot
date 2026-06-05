package com.interviewcopilot.systemdesign;

import com.interviewcopilot.users.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "system_design_sessions", indexes = {
    @Index(name = "idx_sd_sessions_user_challenge", columnList = "user_id, challenge_name")
})
public class SystemDesignSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "challenge_name", nullable = false)
    private String challengeName;

    @Column(name = "requirements_draft", columnDefinition = "TEXT")
    private String requirementsDraft;

    @Column(name = "capacity_draft", columnDefinition = "TEXT")
    private String capacityDraft;

    @Column(name = "apis_draft", columnDefinition = "TEXT")
    private String apisDraft;

    @Column(name = "schema_draft", columnDefinition = "TEXT")
    private String schemaDraft;

    @Column(name = "scaling_draft", columnDefinition = "TEXT")
    private String scalingDraft;

    private Integer score;

    @Column(name = "evaluation_json", columnDefinition = "TEXT")
    private String evaluationJson;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public SystemDesignSession() {
    }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public String getEvaluationJson() { return evaluationJson; }
    public void setEvaluationJson(String evaluationJson) { this.evaluationJson = evaluationJson; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
