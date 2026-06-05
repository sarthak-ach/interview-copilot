package com.interviewcopilot.users;

import com.interviewcopilot.applications.Application;
import com.interviewcopilot.applications.ApplicationRepository;
import com.interviewcopilot.interviews.InterviewMessage;
import com.interviewcopilot.interviews.InterviewMessageRepository;
import com.interviewcopilot.interviews.InterviewSession;
import com.interviewcopilot.interviews.InterviewSessionRepository;
import com.interviewcopilot.jobs.JobMatch;
import com.interviewcopilot.jobs.JobMatchRepository;
import com.interviewcopilot.resumes.Resume;
import com.interviewcopilot.resumes.ResumeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:4000"})
public class DashboardController {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final JobMatchRepository jobMatchRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewMessageRepository interviewMessageRepository;
    private final ApplicationRepository applicationRepository;

    public DashboardController(UserRepository userRepository,
                               ResumeRepository resumeRepository,
                               JobMatchRepository jobMatchRepository,
                               InterviewSessionRepository interviewSessionRepository,
                               InterviewMessageRepository interviewMessageRepository,
                               ApplicationRepository applicationRepository) {
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.jobMatchRepository = jobMatchRepository;
        this.interviewSessionRepository = interviewSessionRepository;
        this.interviewMessageRepository = interviewMessageRepository;
        this.applicationRepository = applicationRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        UUID userId = user.getId();

        // 1. Job Match Stats
        List<Resume> resumes = resumeRepository.findByUserId(userId);
        Integer latestJobMatchScore = null;
        String latestJobMatchTitle = null;

        JobMatch latestMatch = null;
        for (Resume r : resumes) {
            List<JobMatch> matches = jobMatchRepository.findByResumeId(r.getId());
            if (matches != null && !matches.isEmpty()) {
                JobMatch match = matches.get(matches.size() - 1);
                if (latestMatch == null) {
                    latestMatch = match;
                } else {
                    latestMatch = match;
                }
            }
        }
        if (latestMatch != null) {
            latestJobMatchScore = latestMatch.getMatchScore();
            latestJobMatchTitle = latestMatch.getJobDescription().getTitle();
        }

        // 2. Mock Interview Stats
        List<InterviewSession> sessions = interviewSessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Integer latestMockInterviewScore = null;
        String latestMockInterviewCategory = null;
        String latestMockInterviewDate = null;
        String latestMockInterviewStatus = null;
        int totalQuestionsSolved = 0;
        double totalHoursPracticed = 0.0;

        if (sessions != null && !sessions.isEmpty()) {
            InterviewSession latestSession = sessions.get(0);
            latestMockInterviewScore = latestSession.getScore();
            latestMockInterviewCategory = latestSession.getCategory();
            if (latestSession.getCreatedAt() != null) {
                latestMockInterviewDate = latestSession.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd"));
            }
            if (latestMockInterviewScore != null) {
                latestMockInterviewStatus = latestMockInterviewScore >= 7 ? "Passed" : "Needs Practice";
            } else {
                latestMockInterviewStatus = "In Progress";
            }

            for (InterviewSession s : sessions) {
                List<InterviewMessage> msgs = interviewMessageRepository.findBySessionId(s.getId());
                if (msgs != null) {
                    long userMsgsCount = msgs.stream().filter(m -> "USER".equalsIgnoreCase(m.getRole())).count();
                    totalQuestionsSolved += userMsgsCount;
                }
            }
            totalHoursPracticed = Math.round((totalQuestionsSolved * 5.0 / 60.0) * 10.0) / 10.0;
        }

        // 3. Job Tracker Stats
        List<Application> apps = applicationRepository.findByUserId(userId);
        int totalJobsTracked = 0;
        int activeInterviews = 0;
        if (apps != null) {
            totalJobsTracked = apps.size();
            for (Application app : apps) {
                String status = app.getStatus();
                if ("Phone Screen".equalsIgnoreCase(status) || "Technical Round".equalsIgnoreCase(status)) {
                    activeInterviews++;
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("latestJobMatchScore", latestJobMatchScore);
        stats.put("latestJobMatchTitle", latestJobMatchTitle);
        stats.put("latestMockInterviewScore", latestMockInterviewScore);
        stats.put("latestMockInterviewCategory", latestMockInterviewCategory);
        stats.put("latestMockInterviewDate", latestMockInterviewDate);
        stats.put("latestMockInterviewStatus", latestMockInterviewStatus);
        stats.put("totalQuestionsSolved", totalQuestionsSolved);
        stats.put("totalHoursPracticed", totalHoursPracticed);
        stats.put("totalJobsTracked", totalJobsTracked);
        stats.put("activeInterviews", activeInterviews);

        return ResponseEntity.ok(stats);
    }
}
