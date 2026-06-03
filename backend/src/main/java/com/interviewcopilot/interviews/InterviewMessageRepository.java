package com.interviewcopilot.interviews;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewMessageRepository extends JpaRepository<InterviewMessage, UUID> {
    List<InterviewMessage> findBySessionId(UUID sessionId);
}
