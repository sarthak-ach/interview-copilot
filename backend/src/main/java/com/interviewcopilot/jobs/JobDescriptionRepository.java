package com.interviewcopilot.jobs;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobDescriptionRepository extends JpaRepository<JobDescription, UUID> {
    List<JobDescription> findByUserId(UUID userId);

    @Query("SELECT jd FROM JobDescription jd WHERE jd.user.id = :userId OR jd.user IS NULL")
    List<JobDescription> findByUserIdOrGlobal(@Param("userId") UUID userId);

    @Query("SELECT jd FROM JobDescription jd WHERE (jd.user.id = :userId OR jd.user IS NULL) AND " +
           "(LOWER(jd.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(jd.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<JobDescription> findByUserIdOrGlobalWithKeyword(@Param("userId") UUID userId, @Param("keyword") String keyword);

    @Query("SELECT jd FROM JobDescription jd WHERE (jd.user.id = :userId OR jd.user IS NULL) AND " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(jd.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(jd.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<JobDescription> searchJobs(
            @Param("userId") UUID userId, 
            @Param("keyword") String keyword, 
            Pageable pageable);
}
