package com.interviewcopilot.resumes;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewcopilot.users.User;
import com.interviewcopilot.users.UserRepository;
import com.interviewcopilot.jobs.JobDescription;
import com.interviewcopilot.jobs.JobDescriptionRepository;
import com.interviewcopilot.common.KafkaEventPublisher;
import jakarta.annotation.PostConstruct;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ResumeService {

    private static final Logger logger = LoggerFactory.getLogger(ResumeService.class);
    private final Path rootPath = Paths.get("uploads");
    private final ResumeRepository resumeRepository;
    private final ResumeReviewRepository resumeReviewRepository;
    private final UserRepository userRepository;
    private final GeminiProvider geminiProvider;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final TailoredResumeRepository tailoredResumeRepository;
    private final StringRedisTemplate redisTemplate;
    private final KafkaEventPublisher kafkaEventPublisher;
    private final ObjectMapper objectMapper;

    public ResumeService(ResumeRepository resumeRepository,
                         ResumeReviewRepository resumeReviewRepository,
                         UserRepository userRepository,
                         GeminiProvider geminiProvider,
                         JobDescriptionRepository jobDescriptionRepository,
                         TailoredResumeRepository tailoredResumeRepository,
                         StringRedisTemplate redisTemplate,
                         KafkaEventPublisher kafkaEventPublisher) {
        this.resumeRepository = resumeRepository;
        this.resumeReviewRepository = resumeReviewRepository;
        this.userRepository = userRepository;
        this.geminiProvider = geminiProvider;
        this.jobDescriptionRepository = jobDescriptionRepository;
        this.tailoredResumeRepository = tailoredResumeRepository;
        this.redisTemplate = redisTemplate;
        this.kafkaEventPublisher = kafkaEventPublisher;
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload folder", e);
        }
    }

    public Resume uploadResume(MultipartFile file, UUID userId) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "uploaded_resume.pdf";
        }

        // Store file locally
        String storedFilename = UUID.randomUUID().toString() + "-" + originalFilename;
        Path targetPath = rootPath.resolve(storedFilename);
        Files.write(targetPath, file.getBytes());

        // Save Resume Entity (Initial status: PENDING, parsed content initially empty)
        Resume resume = new Resume();
        resume.setUser(user);
        resume.setFileUrl(storedFilename);
        resume.setParsedContent("");
        resume.setUploadedAt(LocalDateTime.now());
        resume.setStatus("PENDING");
        resume = resumeRepository.save(resume);

        // Publish event to Kafka
        kafkaEventPublisher.publishEvent("resume-uploads", resume.getId().toString(), resume.getId().toString());
        kafkaEventPublisher.publishUserActivity("RESUME_UPLOADED", userId, "Uploaded resume: " + originalFilename);

        return resume;
    }

    public List<Resume> getResumesByUserId(UUID userId) {
        return resumeRepository.findByUserId(userId);
    }

    public Optional<Resume> getResumeById(UUID resumeId) {
        return resumeRepository.findById(resumeId);
    }

    public Optional<ResumeReview> getResumeReviewByResumeId(UUID resumeId) {
        return resumeReviewRepository.findByResumeId(resumeId);
    }

    public void deleteResume(UUID id) {
        Optional<Resume> resumeOpt = resumeRepository.findById(id);
        if (resumeOpt.isPresent()) {
            Resume resume = resumeOpt.get();

            // 1. Delete associated ResumeReview
            Optional<ResumeReview> reviewOpt = resumeReviewRepository.findByResumeId(id);
            reviewOpt.ifPresent(resumeReviewRepository::delete);

            // 2. Delete file from disk
            Path filePath = rootPath.resolve(resume.getFileUrl());
            try {
                Files.deleteIfExists(filePath);
                logger.info("Deleted resume file from disk: {}", filePath);
            } catch (IOException e) {
                logger.error("Failed to delete file from disk: " + filePath, e);
            }

            // 3. Delete Resume entity from DB
            resumeRepository.delete(resume);
            logger.info("Deleted resume entity from DB: {}", id);
        }
    }

    private String parseFile(MultipartFile file, String filename) throws IOException {
        String ext = getFileExtension(filename);
        if ("pdf".equalsIgnoreCase(ext)) {
            try (PDDocument document = PDDocument.load(file.getInputStream())) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        } else if ("docx".equalsIgnoreCase(ext)) {
            try (XWPFDocument document = new XWPFDocument(file.getInputStream())) {
                XWPFWordExtractor extractor = new XWPFWordExtractor(document);
                return extractor.getText();
            }
        } else {
            // Default plain text fallback
            return new String(file.getBytes(), StandardCharsets.UTF_8);
        }
    }

    private String getFileExtension(String filename) {
        int index = filename.lastIndexOf('.');
        return (index == -1) ? "" : filename.substring(index + 1);
    }

    private ResumeReview analyzeResume(Resume resume, String originalFilename) {
        String text = resume.getParsedContent();
        String reviewJson;
        int finalScore = 75;

        try {
            logger.info("Attempting Gemini AI review for resume: {}", originalFilename);
            reviewJson = queryGemini(text, originalFilename);
            JsonNode root = objectMapper.readTree(reviewJson);
            if (root.has("score")) {
                finalScore = root.get("score").asInt();
            }
        } catch (Exception e) {
            logger.warn("Gemini AI review failed, falling back to local heuristics: {}", e.getMessage());
            Map<String, Object> heuristicData = generateHeuristicReview(text, originalFilename);
            finalScore = (Integer) heuristicData.get("score");
            try {
                reviewJson = objectMapper.writeValueAsString(heuristicData);
            } catch (Exception ex) {
                reviewJson = "{}";
            }
        }

        ResumeReview review = new ResumeReview();
        review.setResume(resume);
        review.setScore(finalScore);
        review.setReviewJson(reviewJson);
        return review;
    }

    private String queryGemini(String resumeText, String filename) {
        String prompt = "You are an ATS-optimized professional resume evaluator. "
                + "Analyze the following resume text. Output ONLY a valid JSON object. Do not include any markdown backticks or extra comments. "
                + "The JSON structure MUST be exactly as follows: \n"
                + "{\n"
                + "  \"filename\": \"" + filename + "\",\n"
                + "  \"score\": 85, \n" // overall score out of 100
                + "  \"atsKeywords\": 80, \n" // keyword fit score (0-100)
                + "  \"projectImpact\": 78, \n" // impact score (0-100)
                + "  \"interviewDepth\": 75, \n" // interview suitability score (0-100)
                + "  \"strengths\": [\"Strength 1\", \"Strength 2\"], \n" // list of up to 3 strong points
                + "  \"weaknesses\": [\"Weakness 1\", \"Weakness 2\"], \n" // list of up to 3 points to improve
                + "  \"missingKeywords\": [\"Keyword1\", \"Keyword2\"], \n" // standard technology keywords that are missing but expected for this profile
                + "  \"matchedKeywords\": [\"Keyword1\", \"Keyword2\"], \n" // technology keywords found
                + "  \"bulletRewrites\": [\n" // suggest up to 2 bullet improvements based on the resume
                + "    {\n"
                + "      \"original\": \"original bullet text from resume\",\n"
                + "      \"suggested\": \"AI optimized bullet with metrics\",\n"
                + "      \"benefit\": \"why this change helps\"\n"
                + "    }\n"
                + "  ]\n"
                + "}\n\n"
                + "Resume content to analyze:\n"
                + resumeText;

        String rawResult = geminiProvider.generate(prompt);
        return extractJson(rawResult);
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

    private Map<String, Object> generateHeuristicReview(String text, String filename) {
        String lowerText = text.toLowerCase();

        // Technical keyword target list
        List<String> targetKeywords = Arrays.asList(
                "Spring Boot", "Java", "PostgreSQL", "Redis", "Kafka", "Docker",
                "Hibernate", "React", "TypeScript", "JavaScript", "Next.js",
                "Tailwind CSS", "Redux", "CI/CD", "AWS", "Git"
        );

        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (String key : targetKeywords) {
            if (lowerText.contains(key.toLowerCase())) {
                matched.add(key);
            } else {
                missing.add(key);
            }
        }

        // Calculate scores
        int atsKeywordsScore = targetKeywords.isEmpty() ? 50 : (matched.size() * 100) / targetKeywords.size();
        atsKeywordsScore = Math.max(50, Math.min(atsKeywordsScore, 98));

        // Impact detection
        boolean hasMetrics = lowerText.contains("percent") || lowerText.contains("%")
                || lowerText.contains("million") || lowerText.contains("reduced")
                || lowerText.contains("optimized") || lowerText.contains("increased");
        int projectImpact = hasMetrics ? 88 : 70;

        // Depth detection
        int interviewDepth = (matched.size() > 5) ? 82 : 65;

        int score = (atsKeywordsScore + projectImpact + interviewDepth) / 3;

        // Strengths
        List<String> strengths = new ArrayList<>();
        if (matched.contains("Spring Boot") || matched.contains("Java")) {
            strengths.add("Strong backend service architecture using Java and Spring Boot.");
        }
        if (matched.contains("React") || matched.contains("TypeScript")) {
            strengths.add("Proficient in modern type-safe client engineering using React and TypeScript.");
        }
        if (matched.contains("Docker") || matched.contains("CI/CD")) {
            strengths.add("Containerization and pipeline deployment experience.");
        }
        if (strengths.isEmpty()) {
            strengths.add("Clear document structure and formatted experience highlights.");
        }
        if (strengths.size() < 3) {
            strengths.add("Well-outlined technical skill listings.");
        }

        // Weaknesses
        List<String> weaknesses = new ArrayList<>();
        if (missing.contains("Redis")) {
            weaknesses.add("Lacks experience in application caching strategies (e.g. Redis).");
        }
        if (missing.contains("Kafka")) {
            weaknesses.add("No exposure to distributed message queues or async stream architectures (e.g. Kafka).");
        }
        if (missing.contains("Docker")) {
            weaknesses.add("Lacks experience with microservices containerization.");
        }
        if (missing.contains("Next.js")) {
            weaknesses.add("Limited exposure to modern server-side rendering (SSR) web frameworks like Next.js.");
        }
        if (!hasMetrics) {
            weaknesses.add("Quantifiable metrics could be improved to demonstrate project scaling.");
        }
        if (weaknesses.isEmpty()) {
            weaknesses.add("Could expand on cloud deployment methodologies.");
        }

        // Bullet rewrites
        List<Map<String, String>> bulletRewrites = new ArrayList<>();
        if (matched.contains("Java") || matched.contains("Spring Boot")) {
            bulletRewrites.add(Map.of(
                    "original", "Wrote backend REST APIs in Java.",
                    "suggested", "Architected high-throughput REST APIs in Java 21 and Spring Boot, reducing service latency by 25%.",
                    "benefit", "Quantifies business value and states tool proficiency."
            ));
        }
        if (matched.contains("React") || matched.contains("TypeScript")) {
            bulletRewrites.add(Map.of(
                    "original", "Helped design components for the user dashboard.",
                    "suggested", "Engineered reusable React state controllers, improving render loop performance by 32%.",
                    "benefit", "Displays state management optimization skills."
            ));
        }
        if (bulletRewrites.isEmpty()) {
            bulletRewrites.add(Map.of(
                    "original", "Updated application features and layouts.",
                    "suggested", "Spearheaded modular service updates and layout improvements, boosting release velocity by 15%.",
                    "benefit", "Emphasizes initiative and positive delivery impact."
            ));
        }

        Map<String, Object> data = new HashMap<>();
        data.put("filename", filename);
        data.put("score", score);
        data.put("atsKeywords", atsKeywordsScore);
        data.put("projectImpact", projectImpact);
        data.put("interviewDepth", interviewDepth);
        data.put("strengths", strengths);
        data.put("weaknesses", weaknesses);
        data.put("missingKeywords", missing.subList(0, Math.min(5, missing.size())));
        data.put("matchedKeywords", matched);
        data.put("bulletRewrites", bulletRewrites);

        return data;
    }

    public TailoredResume tailorResume(UUID resumeId, UUID jobDescriptionId) {
        // 1. Check if tailored resume already exists
        Optional<TailoredResume> existing = tailoredResumeRepository.findByResumeIdAndJobDescriptionId(resumeId, jobDescriptionId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // 2. Fetch original resume and targeted JD
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found with ID: " + resumeId));
        JobDescription jd = jobDescriptionRepository.findById(jobDescriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Job Description not found with ID: " + jobDescriptionId));

        // 3. Tailor the content using Gemini
        String tailoredJson;
        try {
            logger.info("Attempting Gemini AI resume tailoring for job description: {}", jd.getTitle());
            tailoredJson = queryGeminiForTailoring(resume.getParsedContent(), jd.getDescription());
        } catch (Exception e) {
            logger.warn("Gemini AI tailoring failed, falling back to local heuristics: {}", e.getMessage());
            Map<String, Object> heuristicData = generateHeuristicTailoring(resume.getParsedContent(), jd.getDescription());
            try {
                tailoredJson = objectMapper.writeValueAsString(heuristicData);
            } catch (Exception ex) {
                tailoredJson = "{}";
            }
        }

        // 4. Save and return tailored entity
        TailoredResume tailoredResume = new TailoredResume();
        tailoredResume.setResume(resume);
        tailoredResume.setJobDescription(jd);
        tailoredResume.setTailoredJson(tailoredJson);
        return tailoredResumeRepository.save(tailoredResume);
    }

    private String queryGeminiForTailoring(String resumeText, String jdText) {
        String prompt = "You are a professional resume writer and ATS optimization expert. "
                + "Your task is to tailor the user's resume to align with the provided job description. "
                + "Output ONLY a valid JSON object. Do not include any markdown backticks or comments. The structure MUST be exactly: \n"
                + "{\n"
                + "  \"bulletRewrites\": [\n"
                + "    {\n"
                + "      \"original\": \"original bullet text from the resume\",\n"
                + "      \"suggested\": \"AI-optimized version with quantified metrics, action verbs, and relevant keywords\",\n"
                + "      \"benefit\": \"why this edit is more compelling for the specific role\"\n"
                + "    }\n"
                + "  ],\n"
                + "  \"keywordOptimizedContent\": \"Detailed suggestions on tailoring your overall professional summary or layout to showcase matching skills.\"\n"
                + "}\n\n"
                + "Resume content:\n" + resumeText + "\n\n"
                + "Job description:\n" + jdText;

        String rawResult = geminiProvider.generate(prompt);
        return extractJson(rawResult);
    }

    private Map<String, Object> generateHeuristicTailoring(String resumeText, String jdText) {
        String lowerResume = resumeText.toLowerCase();
        String lowerJd = jdText.toLowerCase();

        // Technical keyword target list
        List<String> targetKeywords = Arrays.asList(
                "Spring Boot", "Java", "PostgreSQL", "Redis", "Kafka", "Docker",
                "Kubernetes", "Hibernate", "React", "TypeScript", "JavaScript", "Next.js",
                "Tailwind CSS", "Redux", "CI/CD", "AWS", "Git"
        );

        List<String> missing = new ArrayList<>();
        for (String key : targetKeywords) {
            if (lowerJd.contains(key.toLowerCase()) && !lowerResume.contains(key.toLowerCase())) {
                missing.add(key);
            }
        }

        List<Map<String, String>> bulletRewrites = new ArrayList<>();
        // Split resume by lines to find bullets
        String[] lines = resumeText.split("\\n");
        int count = 0;
        for (String line : lines) {
            String trimmed = line.trim();
            if ((trimmed.startsWith("-") || trimmed.startsWith("*")) && trimmed.length() > 15) {
                String cleanBullet = trimmed.substring(1).trim();

                String suggested;
                String benefit;
                if (count == 0 && !missing.isEmpty()) {
                    suggested = "Spearheaded backend service optimization, weaving in " + missing.get(0) + " to resolve scale constraints, boosting performance by 25%.";
                    benefit = "Directly introduces missing keyword '" + missing.get(0) + "' while showing quantified metrics.";
                } else if (count == 1 && missing.size() > 1) {
                     suggested = "Refactored user dashboard controllers using " + missing.get(1) + ", reducing UI load latencies and improving rendering times by 30%.";
                     benefit = "Demonstrates frontend type-safety and interface improvements using " + missing.get(1) + ".";
                } else {
                    suggested = cleanBullet + " (Optimized delivery pipelines and leveraged modern deployment frameworks to raise release frequencies by 15%.)";
                    benefit = "Adds execution metrics and links results back to business outcomes.";
                }

                bulletRewrites.add(Map.of(
                        "original", cleanBullet,
                        "suggested", suggested,
                        "benefit", benefit
                ));
                count++;
                if (count >= 3) break;
            }
        }

        if (bulletRewrites.isEmpty()) {
            bulletRewrites.add(Map.of(
                    "original", "Developed backend services using Java.",
                    "suggested", "Architected Spring Boot microservices with Java, integrating PostgreSQL and Redis to reduce query latency by 35%.",
                    "benefit", "Links tech stack directly to measurable latency improvements."
            ));
            bulletRewrites.add(Map.of(
                    "original", "Helped with frontend UI adjustments.",
                    "suggested", "Engineered modular React hooks and TypeScript dashboard panels, enhancing loading times by 20%.",
                    "benefit", "Highlights component-driven development and type-safe frontend practices."
            ));
        }

        String missingStr = missing.isEmpty() ? "none" : String.join(", ", missing);

        List<String> expectedKeywords = new ArrayList<>();
        for (String k : targetKeywords) {
            if (lowerJd.contains(k.toLowerCase())) {
                expectedKeywords.add(k);
            }
        }

        String keywordOptimizedContent = "Your resume has a strong foundation, but you should explicitly weave in the following missing keywords from the JD: " + missingStr + ".\n\n"
                + "Consider adding a dedicated 'Technical Skills' grid at the top of your resume containing: "
                + String.join(", ", expectedKeywords)
                + ". This will pass ATS screening parser checks.";

        return Map.of(
                "bulletRewrites", bulletRewrites,
                "keywordOptimizedContent", keywordOptimizedContent
        );
    }

    @Transactional
    public void processUploadedResumeAsync(UUID resumeId) {
        Optional<Resume> resumeOpt = resumeRepository.findById(resumeId);
        if (resumeOpt.isEmpty()) {
            logger.error("Resume not found for async processing: {}", resumeId);
            return;
        }

        Resume resume = resumeOpt.get();
        resume.setStatus("PROCESSING");
        resumeRepository.save(resume);

        try {
            // Retrieve stored file
            Path filePath = rootPath.resolve(resume.getFileUrl());
            String originalFilename = resume.getFileUrl();
            if (originalFilename.length() > 37) {
                originalFilename = originalFilename.substring(37);
            }

            // Extract text from the saved file on disk
            String parsedContent = parseFileFromDisk(filePath, originalFilename);
            resume.setParsedContent(parsedContent);

            // Generate ResumeReview
            ResumeReview review = analyzeResume(resume, originalFilename);
            resumeReviewRepository.save(review);

            // Update status
            resume.setStatus("COMPLETED");
            resumeRepository.save(resume);

            // Cache the review JSON in Redis
            try {
                String cacheKey = "resume-review:" + resumeId;
                redisTemplate.opsForValue().set(cacheKey, review.getReviewJson());
                logger.info("Cached resume review in Redis for key '{}'", cacheKey);
            } catch (Exception re) {
                logger.warn("Failed to write resume review to Redis cache: {}", re.getMessage());
            }

            logger.info("Successfully processed resume async: {}", resumeId);

        } catch (Exception e) {
            logger.error("Failed async processing of resume: {}", resumeId, e);
            resume.setStatus("FAILED");
            resumeRepository.save(resume);
        }
    }

    private String parseFileFromDisk(Path filePath, String filename) throws IOException {
        String ext = getFileExtension(filename);
        byte[] fileBytes = Files.readAllBytes(filePath);
        if ("pdf".equalsIgnoreCase(ext)) {
            try (PDDocument document = PDDocument.load(fileBytes)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        } else if ("docx".equalsIgnoreCase(ext)) {
            java.io.ByteArrayInputStream bis = new java.io.ByteArrayInputStream(fileBytes);
            try (XWPFDocument document = new XWPFDocument(bis)) {
                XWPFWordExtractor extractor = new XWPFWordExtractor(document);
                return extractor.getText();
            }
        } else {
            return new String(fileBytes, StandardCharsets.UTF_8);
        }
    }

    public String getResumeReviewJsonCached(UUID resumeId) {
        String cacheKey = "resume-review:" + resumeId;
        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                logger.info("Redis cache HIT for resume review key '{}'", cacheKey);
                return cached;
            }
        } catch (Exception e) {
            logger.warn("Redis read failed: {}", e.getMessage());
        }

        // Cache miss -> load from database and write to Redis
        Optional<ResumeReview> reviewOpt = resumeReviewRepository.findByResumeId(resumeId);
        if (reviewOpt.isPresent()) {
            String reviewJson = reviewOpt.get().getReviewJson();
            try {
                redisTemplate.opsForValue().set(cacheKey, reviewJson);
                logger.info("Redis cache populated for resume review key '{}'", cacheKey);
            } catch (Exception e) {
                // ignore
            }
            return reviewJson;
        }
        return null;
    }
}
