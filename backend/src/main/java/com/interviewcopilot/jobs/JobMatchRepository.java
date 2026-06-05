package com.interviewcopilot.jobs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobMatchRepository extends JpaRepository<JobMatch, UUID> {
    List<JobMatch> findByResumeId(UUID resumeId);
    Optional<JobMatch> findByResumeIdAndJobDescriptionId(UUID resumeId, UUID jobDescriptionId);
}
