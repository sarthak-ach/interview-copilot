package com.interviewcopilot.jobs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewcopilot.users.User;
import com.interviewcopilot.users.UserRepository;
import com.interviewcopilot.resumes.Resume;
import com.interviewcopilot.resumes.ResumeRepository;
import com.interviewcopilot.resumes.GeminiProvider;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.*;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class JobController {

    private static final Logger logger = LoggerFactory.getLogger(JobController.class);

    private final JobDescriptionRepository jobDescriptionRepository;
    private final JobMatchRepository jobMatchRepository;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final GeminiProvider geminiProvider;
    private final ObjectMapper objectMapper;

    public JobController(JobDescriptionRepository jobDescriptionRepository,
                         JobMatchRepository jobMatchRepository,
                         UserRepository userRepository,
                         ResumeRepository resumeRepository,
                         GeminiProvider geminiProvider) {
        this.jobDescriptionRepository = jobDescriptionRepository;
        this.jobMatchRepository = jobMatchRepository;
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.geminiProvider = geminiProvider;
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping("/descriptions")
    public ResponseEntity<?> createJobDescription(@Valid @RequestBody JobDescRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        JobDescription jd = new JobDescription();
        jd.setUser(user);
        jd.setTitle(request.getTitle());
        jd.setDescription(request.getDescription());
        jd = jobDescriptionRepository.save(jd);

        return ResponseEntity.ok(Map.of(
                "id", jd.getId(),
                "title", jd.getTitle(),
                "message", "Job Description stored successfully"
        ));
    }

    @GetMapping("/descriptions")
    public ResponseEntity<?> getJobDescriptions(
            @RequestParam UUID userId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        
        if (page == null) {
            List<JobDescription> jds;
            if (keyword != null && !keyword.isBlank()) {
                jds = jobDescriptionRepository.findByUserIdOrGlobalWithKeyword(userId, keyword);
            } else {
                jds = jobDescriptionRepository.findByUserIdOrGlobal(userId);
            }
            return ResponseEntity.ok(jds.stream().map(jd -> Map.of(
                    "id", jd.getId(),
                    "title", jd.getTitle(),
                    "description", jd.getDescription()
            )).toList());
        } else {
            int pageSize = (size != null) ? size : 8;
            Pageable pageable = PageRequest.of(page, pageSize);
            Page<JobDescription> jdPage = jobDescriptionRepository.searchJobs(userId, keyword, pageable);
            
            return ResponseEntity.ok(Map.of(
                    "content", jdPage.getContent().stream().map(jd -> Map.of(
                            "id", jd.getId(),
                            "title", jd.getTitle(),
                            "description", jd.getDescription()
                    )).toList(),
                    "totalPages", jdPage.getTotalPages(),
                    "totalElements", jdPage.getTotalElements(),
                    "currentPage", jdPage.getNumber(),
                    "pageSize", jdPage.getSize()
            ));
        }
    }

    @PostMapping("/seed")
    public ResponseEntity<?> seedJobs() {
        String[] companies = {"Google", "Stripe", "Uber", "Airbnb", "Meta", "Apple", "Microsoft", "Vercel", "Shopify", 
                              "Netflix", "Datadog", "Snowflake", "Figma", "Supabase", "Railway", "Notion", "Slack", 
                              "Zoom", "Block", "Revolut", "Harness", "Elastic", "Okta", "Twilio", "Adobe"};
        
        String[] seniority = {"Junior", "Mid-level", "Senior", "Lead", "Staff", "Principal"};

        String[][] tracks = {
            // Frontend
            {"React Developer", "Building user-facing web dashboards. Stack: React, TypeScript, Next.js, Redux, Tailwind CSS, Cypress."},
            {"Frontend Engineer", "Designing and implementing responsive components. Stack: Vue.js, JavaScript, HTML5, CSS3, Vite, Jest."},
            {"UI/UX Developer", "Translating Figma designs into pixel-perfect modular systems. Stack: React, CSS Modules, Design Systems, Storybook."},
            
            // Backend
            {"Spring Boot Developer", "Architecting high-scale REST APIs and microservices. Stack: Java 21, Spring Boot, Spring Security, JPA, PostgreSQL, Redis, Kafka."},
            {"Go Backend Engineer", "Implementing high-performance concurrent processing services. Stack: Golang, gRPC, Protocol Buffers, Go-kit, MySQL, Redis, AWS."},
            {"Python Systems Engineer", "Developing scalable orchestration platforms and data engines. Stack: Python, Django, FastAPI, Celery, MongoDB, Docker."},
            {"Node.js Engineer", "Building real-time event-driven streaming web backends. Stack: Node.js, Express, Socket.io, TypeScript, PostgreSQL, AWS Lambda."},
            {"Ruby on Rails Developer", "Rapidly bootstrapping full-featured marketplace portals. Stack: Ruby, Rails, Postgres, Hotwire, Tailwind, Heroku."},

            // DevOps & Systems
            {"DevOps Infrastructure Engineer", "Automating containerized clusters and CI/CD pipelines. Stack: Kubernetes, Docker, AWS (EKS, EC2, RDS), Terraform, GitHub Actions."},
            {"Cloud Engineer", "Managing secure and high-availability cloud layouts. Stack: GCP, Terraform, Cloudflare, IAM, Bash, Ansible, Prometheus, Grafana."},
            {"Security Architect", "Implementing secure identity configurations, OAuth2, and firewall systems. Stack: Spring Security, OAuth2, IAM, Vault, SSL/TLS, Pen-testing."},

            // Fullstack
            {"Full Stack Next.js Engineer", "Designing end-to-end user dashboards and GraphQL APIs. Stack: React, Next.js, Node.js, GraphQL, Prisma, PostgreSQL."},
            {"Full Stack Developer", "Maintaining core platforms and customer-facing flows. Stack: Angular, Java, Spring Boot, Hibernate, Oracle DB, Jenkins."}
        };

        Random random = new Random();
        List<JobDescription> created = new ArrayList<>();

        for (int i = 0; i < 200; i++) {
            String company = companies[random.nextInt(companies.length)];
            String level = seniority[random.nextInt(seniority.length)];
            String[] track = tracks[random.nextInt(tracks.length)];
            
            String title = company + " - " + level + " " + track[0];
            String description = "About the Role:\n" 
                    + "We are looking for a " + level + " " + track[0] + " to join our product engineering team at " + company + ".\n\n"
                    + "Requirements & Responsibilities:\n"
                    + "- Collaborate with cross-functional teams to design and deliver high-impact features.\n"
                    + "- Write clean, testable, and maintainable code adhering to solid principles.\n"
                    + "- " + track[1] + "\n"
                    + "- 3+ years of experience with related tools and frameworks.\n"
                    + "- Outstanding analytical, debugging, and collaboration capabilities.";

            JobDescription jd = new JobDescription();
            jd.setUser(null); // NULL user = common for all users!
            jd.setTitle(title);
            jd.setDescription(description);
            created.add(jobDescriptionRepository.save(jd));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Successfully seeded 200 jobs common to all users in the database.",
                "count", created.size()
        ));
    }

    @PostMapping("/matches")
    public ResponseEntity<?> matchResume(@Valid @RequestBody MatchRequest request) {
        // 1. Check if match already exists
        Optional<JobMatch> existingMatch = jobMatchRepository.findByResumeIdAndJobDescriptionId(
                request.getResumeId(), request.getJobDescriptionId());

        if (existingMatch.isPresent()) {
            JobMatch match = existingMatch.get();
            try {
                JsonNode analysis = objectMapper.readTree(match.getAnalysisJson());
                Map<String, Object> res = new HashMap<>();
                res.put("id", match.getId());
                res.put("resumeId", match.getResume().getId());
                res.put("jobDescriptionId", match.getJobDescription().getId());
                res.put("matchScore", match.getMatchScore());
                res.put("strongMatches", objectMapper.convertValue(analysis.get("strongMatches"), List.class));
                res.put("missingSkills", objectMapper.convertValue(analysis.get("missingSkills"), List.class));
                res.put("recommendations", objectMapper.convertValue(analysis.get("recommendations"), List.class));
                return ResponseEntity.ok(res);
            } catch (Exception e) {
                logger.warn("Failed to parse cached analysis JSON, recalculating...");
            }
        }

        // 2. Fetch Resume and JD to run calculations
        Resume resume = resumeRepository.findById(request.getResumeId())
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));
        JobDescription jd = jobDescriptionRepository.findById(request.getJobDescriptionId())
                .orElseThrow(() -> new IllegalArgumentException("Job Description not found"));

        int score = 75;
        List<String> strongMatches = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        try {
            logger.info("Attempting Gemini analysis for job matching: {}", jd.getTitle());
            String prompt = "You are an ATS parser. Analyze the compatibility between this resume and this job description. "
                    + "Output ONLY a valid JSON object. Do not include any markdown backticks or comments. The structure MUST be exactly: \n"
                    + "{\n"
                    + "  \"score\": 85,\n"
                    + "  \"strongMatches\": [\"Skill A\", \"Skill B\"],\n"
                    + "  \"missingSkills\": [\"Skill C\", \"Skill D\"],\n"
                    + "  \"recommendations\": [\"Tip 1\", \"Tip 2\"]\n"
                    + "}\n\n"
                    + "Resume text:\n" + resume.getParsedContent() + "\n\n"
                    + "Job description:\n" + jd.getDescription();

            String rawResponse = geminiProvider.generate(prompt);
            JsonNode root = objectMapper.readTree(extractJson(rawResponse));
            score = root.path("score").asInt(75);

            if (root.has("strongMatches") && root.get("strongMatches").isArray()) {
                for (JsonNode n : root.get("strongMatches")) {
                    strongMatches.add(n.asText());
                }
            }
            if (root.has("missingSkills") && root.get("missingSkills").isArray()) {
                for (JsonNode n : root.get("missingSkills")) {
                    missingSkills.add(n.asText());
                }
            }
            if (root.has("recommendations") && root.get("recommendations").isArray()) {
                for (JsonNode n : root.get("recommendations")) {
                    recommendations.add(n.asText());
                }
            }
        } catch (Exception e) {
            logger.warn("Gemini matching failed, running fallback keyword heuristic: {}", e.getMessage());
            Map<String, Object> heuristic = runHeuristicMatch(resume.getParsedContent(), jd.getDescription());
            score = (Integer) heuristic.get("score");
            strongMatches = (List<String>) heuristic.get("strongMatches");
            missingSkills = (List<String>) heuristic.get("missingSkills");
            recommendations = (List<String>) heuristic.get("recommendations");
        }

        // 3. Save new JobMatch to DB
        JobMatch match = new JobMatch();
        match.setResume(resume);
        match.setJobDescription(jd);
        match.setMatchScore(score);

        try {
            Map<String, Object> analysisMap = Map.of(
                    "strongMatches", strongMatches,
                    "missingSkills", missingSkills,
                    "recommendations", recommendations
            );
            match.setAnalysisJson(objectMapper.writeValueAsString(analysisMap));
        } catch (Exception e) {
            match.setAnalysisJson("{}");
        }

        match = jobMatchRepository.save(match);

        return ResponseEntity.ok(Map.of(
                "id", match.getId(),
                "resumeId", resume.getId(),
                "jobDescriptionId", jd.getId(),
                "matchScore", score,
                "strongMatches", strongMatches,
                "missingSkills", missingSkills,
                "recommendations", recommendations
        ));
    }

    private String extractJson(String text) {
        if (text == null) return "{}";
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    private Map<String, Object> runHeuristicMatch(String resumeText, String jdText) {
        String lowerResume = resumeText.toLowerCase();
        String lowerJd = jdText.toLowerCase();

        List<String> keywords = Arrays.asList(
                "Java", "Spring Boot", "React", "TypeScript", "JavaScript", "PostgreSQL",
                "Redis", "Kafka", "Docker", "Kubernetes", "AWS", "Git", "Next.js",
                "Hibernate", "REST API", "Microservices", "CI/CD", "Tailwind"
        );

        List<String> strongMatches = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        for (String word : keywords) {
            boolean inJd = lowerJd.contains(word.toLowerCase());
            boolean inResume = lowerResume.contains(word.toLowerCase());

            if (inJd) {
                if (inResume) {
                    strongMatches.add(word);
                } else {
                    missingSkills.add(word);
                }
            }
        }

        int score = 60;
        if (!strongMatches.isEmpty() || !missingSkills.isEmpty()) {
            score = (strongMatches.size() * 100) / (strongMatches.size() + missingSkills.size());
            score = Math.max(45, Math.min(score, 98));
        }

        List<String> recommendations = new ArrayList<>();
        if (!missingSkills.isEmpty()) {
            recommendations.add("Consider acquiring or highlighting experience in: " + String.join(", ", missingSkills));
        }
        recommendations.add("Tailor your professional summary to highlight matching skills: " + String.join(", ", strongMatches));

        return Map.of(
                "score", score,
                "strongMatches", strongMatches,
                "missingSkills", missingSkills,
                "recommendations", recommendations
        );
    }

    public static class JobDescRequest {
        @NotNull
        private UUID userId;
        @NotBlank
        private String title;
        @NotBlank
        private String description;

        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class MatchRequest {
        @NotNull
        private UUID resumeId;
        @NotNull
        private UUID jobDescriptionId;

        public UUID getResumeId() { return resumeId; }
        public void setResumeId(UUID resumeId) { this.resumeId = resumeId; }

        public UUID getJobDescriptionId() { return jobDescriptionId; }
        public void setJobDescriptionId(UUID jobDescriptionId) { this.jobDescriptionId = jobDescriptionId; }
    }
}
