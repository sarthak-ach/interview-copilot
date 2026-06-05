# Interview Copilot - Project Plan

## Vision

Interview Copilot is an AI-powered platform that helps software engineers prepare for interviews, optimize resumes, track applications, practice system design, and receive personalized feedback.

The project demonstrates:

* Next.js 16
* Spring Boot 3
* PostgreSQL
* AI Integration (Bedrock/OpenAI/Ollama)
* Authentication & Authorization
* File Uploads
* Async Processing
* CI/CD
* Production Deployment

---

# Phase 0 - Architecture & Setup

## Tech Stack

### Frontend

* Next.js 16
* TypeScript
* Tailwind CSS
* Redux Toolkit
* TanStack Query
* shadcn/ui

### Backend

* Java 21
* Spring Boot 3
* Spring Security
* Spring Data JPA
* Spring AI
* PostgreSQL
* Redis

### Infrastructure

* Docker
* GitHub Actions
* Vercel (Frontend)
* Render/Railway (Backend)
* Neon PostgreSQL

---

# Phase 1 - Authentication

## Goals

Allow users to create accounts and manage sessions.

## Features

### User Registration

* Name
* Email
* Password

### Login

* JWT Authentication
* Refresh Token Support

### Profile

* View Profile
* Update Profile

## Database

### users

| Field         | Type      |
| ------------- | --------- |
| id            | UUID      |
| email         | String    |
| password_hash | String    |
| full_name     | String    |
| created_at    | Timestamp |

---

# Phase 2 - Resume Analyzer

## Goals

Upload resumes and receive AI feedback.

## Features

### Resume Upload

Supported formats:

* PDF
* DOCX

### Resume Parsing

Extract:

* Skills
* Experience
* Education
* Projects

### AI Review

Generate:

* Resume Score
* Strengths
* Weaknesses
* Missing Keywords

## Database

### resumes

| Field          | Type      |
| -------------- | --------- |
| id             | UUID      |
| user_id        | UUID      |
| file_url       | String    |
| parsed_content | Text      |
| uploaded_at    | Timestamp |

### resume_reviews

| Field       | Type    |
| ----------- | ------- |
| id          | UUID    |
| resume_id   | UUID    |
| score       | Integer |
| review_json | JSONB   |

---

# Phase 3 - Job Match Analyzer

## Goals

Compare resumes against job descriptions.

## Features

### Paste Job Description

Store job descriptions.

### AI Matching

Generate:

* Match Score
* Missing Skills
* Missing Keywords
* Recommended Improvements

### Gap Analysis

Display:

* Strong Matches
* Weak Matches
* Missing Skills

## Database

### job_descriptions

| Field       | Type   |
| ----------- | ------ |
| id          | UUID   |
| user_id     | UUID   |
| title       | String |
| description | Text   |

### job_matches

| Field              | Type    |
| ------------------ | ------- |
| id                 | UUID    |
| resume_id          | UUID    |
| job_description_id | UUID    |
| match_score        | Integer |
| analysis_json      | JSONB   |

---

# Phase 4 - Resume Tailoring

## Goals

Generate role-specific resumes.

## Features

### Tailor Resume

Input:

* Resume
* Job Description

Output:

* Improved Resume Bullets
* Keyword Optimized Content

### Resume Diff View

Display:

* Original Version
* Suggested Version

---

# Phase 5 - AI Mock Interviews

## Goals

Simulate technical interviews.

## Interview Categories

* Java
* Spring Boot
* React
* System Design
* Behavioral

## Features

### Interview Session

AI asks questions.

User responds.

### Evaluation

Generate:

* Score
* Missing Topics
* Improvement Suggestions

### Session History

Review past interviews.

## Database

### interview_sessions

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| category   | String    |
| score      | Integer   |
| created_at | Timestamp |

### interview_messages

| Field      | Type   |
| ---------- | ------ |
| id         | UUID   |
| session_id | UUID   |
| role       | String |
| content    | Text   |

---

# Phase 6 - System Design Coach

## Goals

Create the flagship feature.

## Features

### Design Challenges

Examples:

* Design WhatsApp
* Design Uber
* Design Netflix
* Design YouTube

### AI Interviewer

Guides users through:

* Functional Requirements
* Non-Functional Requirements
* Capacity Estimation
* Database Design
* API Design
* Scaling Strategy

### Evaluation

Generate:

* Requirements Score
* Scalability Score
* Architecture Score
* Communication Score

### Deliverables

Generate:

* Design Summary
* Improvement Areas

## Database

### system_design_sessions

| Field   | Type    |
| ------- | ------- |
| id      | UUID    |
| user_id | UUID    |
| topic   | String  |
| score   | Integer |

---

# Phase 7 - Job Tracker

## Goals

Track job applications.

## Features

### Application Management

Statuses:

* Saved
* Applied
* Recruiter Screen
* Technical Round
* Manager Round
* Offer
* Rejected

### Kanban Board

Drag and Drop support.

### Notes

Store recruiter notes and feedback.

## Database

### applications

| Field        | Type   |
| ------------ | ------ |
| id           | UUID   |
| user_id      | UUID   |
| company_name | String |
| role_name    | String |
| status       | String |
| applied_date | Date   |

---

# Phase 8 - Networking Assistant

## Goals

Generate outreach messages.

## Features

### Referral Request Generator

Input:

* Company
* Position

Output:

* Referral Request Message

### Recruiter Outreach

Generate:

* Intro Message
* Follow-Up Message

### Thank You Notes

Generate post-interview messages.

---

# AI Service Architecture

## Interface

```java
public interface AIProvider {
    String generate(String prompt);
}
```

## Implementations

* OllamaProvider
* BedrockProvider
* OpenAIProvider

## Benefits

* Easy provider switching
* Cost optimization
* Better testing

---

# API Structure

## Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

## Resume

```text
POST /api/resumes/upload
GET /api/resumes
GET /api/resumes/{id}
```

## Job Matching

```text
POST /api/jobs/analyze
```

## Interviews

```text
POST /api/interviews/start
POST /api/interviews/message
GET /api/interviews/history
```

## Applications

```text
POST /api/applications
PUT /api/applications/{id}
GET /api/applications
```

---

# Non-Functional Requirements

## Security

* JWT Authentication
* Password Hashing (BCrypt)
* Rate Limiting
* Input Validation

## Performance

* Redis Cache
* Pagination
* Lazy Loading

## Observability

* Spring Boot Actuator
* Structured Logging
* Request Metrics

## CI/CD

GitHub Actions:

* Build
* Test
* Docker Build
* Deploy

---

# MVP Scope

The MVP includes:

* Authentication
* Resume Upload
* Resume Review
* Job Match Analyzer
* Mock Interview Chat
* System Design Coach
* Deployment

Everything else is Phase 2.

---

# Timeline

## Week 1

* Project setup
* Authentication
* Database schema

## Week 2

* Resume upload
* Resume parsing

## Week 3

* Resume review
* Job match analyzer

## Week 4

* Mock interviews

## Week 5

* System design coach

## Week 6

* Job tracker

## Week 7

* Deployment
* Monitoring

## Week 8

* Polish
* Landing page
* Demo videos
* Documentation

---

# Success Criteria

A recruiter can:

1. Sign up
2. Upload a resume
3. Analyze a job description
4. Run a mock interview
5. Practice system design
6. Track applications

All from a deployed public URL.
