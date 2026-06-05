package com.interviewcopilot.codeeditor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CodeDraftRepository extends JpaRepository<CodeDraft, UUID> {
    Optional<CodeDraft> findByUserIdAndChallengeNameAndLanguage(UUID userId, String challengeName, String language);
}
