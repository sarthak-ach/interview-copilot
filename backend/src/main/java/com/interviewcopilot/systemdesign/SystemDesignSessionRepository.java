package com.interviewcopilot.systemdesign;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemDesignSessionRepository extends JpaRepository<SystemDesignSession, UUID> {
    Optional<SystemDesignSession> findByUserIdAndChallengeName(UUID userId, String challengeName);
}
