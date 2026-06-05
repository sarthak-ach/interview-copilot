package com.interviewcopilot.resumes;

import com.interviewcopilot.users.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "resumes", indexes = {
    @Index(name = "idx_resumes_user_id", columnList = "user_id")
})
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "parsed_content", columnDefinition = "TEXT")
    private String parsedContent;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    @Column(nullable = false)
    private String status = "PENDING";

    public Resume() {
    }

    public Resume(UUID id, User user, String fileUrl, String parsedContent, LocalDateTime uploadedAt, String status) {
        this.id = id;
        this.user = user;
        this.fileUrl = fileUrl;
        this.parsedContent = parsedContent;
        this.uploadedAt = uploadedAt;
        this.status = status;
    }

    @PrePersist
    protected void onCreate() {
        this.uploadedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "PENDING";
        }
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getParsedContent() { return parsedContent; }
    public void setParsedContent(String parsedContent) { this.parsedContent = parsedContent; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
