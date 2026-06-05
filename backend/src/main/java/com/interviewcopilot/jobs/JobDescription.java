package com.interviewcopilot.jobs;

import com.interviewcopilot.users.User;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "job_descriptions", indexes = {
    @Index(name = "idx_job_desc_user_id", columnList = "user_id")
})
public class JobDescription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    public JobDescription() {
    }

    public JobDescription(UUID id, User user, String title, String description) {
        this.id = id;
        this.user = user;
        this.title = title;
        this.description = description;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
