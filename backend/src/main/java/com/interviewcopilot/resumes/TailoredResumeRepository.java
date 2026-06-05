package com.interviewcopilot.resumes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TailoredResumeRepository extends JpaRepository<TailoredResume, UUID> {
    Optional<TailoredResume> findByResumeIdAndJobDescriptionId(UUID resumeId, UUID jobDescriptionId);
}
