package com.interviewcopilot.resumes;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewcopilot.users.User;
import com.interviewcopilot.users.UserRepository;
import jakarta.annotation.PostConstruct;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
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
    private final ObjectMapper objectMapper;

    public ResumeService(ResumeRepository resumeRepository,
                         ResumeReviewRepository resumeReviewRepository,
                         UserRepository userRepository,
                         GeminiProvider geminiProvider) {
        this.resumeRepository = resumeRepository;
        this.resumeReviewRepository = resumeReviewRepository;
        this.userRepository = userRepository;
        this.geminiProvider = geminiProvider;
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

        // Extract text
        String parsedContent = parseFile(file, originalFilename);

        // Save Resume Entity
        Resume resume = new Resume();
        resume.setUser(user);
        resume.setFileUrl(storedFilename); // Store safe unique name in DB
        resume.setParsedContent(parsedContent);
        resume.setUploadedAt(LocalDateTime.now());
        resume = resumeRepository.save(resume);

        // Generate ResumeReview
        ResumeReview review = analyzeResume(resume, originalFilename);
        resumeReviewRepository.save(review);

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
}
