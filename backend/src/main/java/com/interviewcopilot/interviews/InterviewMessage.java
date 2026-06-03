package com.interviewcopilot.interviews;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "interview_messages", indexes = {
    @Index(name = "idx_int_msgs_session_id", columnList = "session_id")
})
public class InterviewMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @Column(nullable = false)
    private String role; // "AI" or "USER"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    public InterviewMessage() {
    }

    public InterviewMessage(UUID id, InterviewSession session, String role, String content) {
        this.id = id;
        this.session = session;
        this.role = role;
        this.content = content;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public InterviewSession getSession() { return session; }
    public void setSession(InterviewSession session) { this.session = session; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
