# Interview Copilot Clipper Extension

The **Interview Copilot Clipper** is a Google Chrome browser extension (Manifest V3) that enables you to clip job listings from LinkedIn directly into your Interview Copilot Kanban board (Job Tracker) in one click.

---

## Features

- **Direct Account Login**: Authenticate directly with your Interview Copilot local account from the extension.
- **Session Persistence**: Securely stores your authentication token and user profile in local browser storage so you don't have to keep logging in.
- **Automated LinkedIn Scraping**: Automatically extracts Job Title, Company Name, and Job Description from LinkedIn listing pages.
- **Kanban Board Integration**: Saves scraped details as a Job Description and creates a pipeline card under the **Saved** column on your Kanban board.

---

## Installation

Since this is a developer extension, you need to load it unpacked in Google Chrome:

1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** by toggling the switch in the top-right corner to **ON**.
3. Click the **Load unpacked** button in the top-left corner.
4. Navigate to and select the `browser-extension` directory:
   ```text
   interview-copilot/browser-extension/
   ```
5. Click **Select Folder**. The extension will load and appear in your browser.
6. (Optional) Click the Extensions jigsaw puzzle piece in your browser toolbar and pin the **Interview Copilot Clipper** for quick access.

---

## How to Use

### 1. Start Your Local Application
Make sure your local services are running:
- **Backend (Spring Boot)**: Running on `http://localhost:8080` (CORS-configured to accept requests from the extension).
- **Frontend (Next.js)**: Running on `http://localhost:4000`.

### 2. Log In to the Extension
1. Click the extension icon in your browser toolbar.
2. Enter the **Email** and **Password** for your registered Interview Copilot account.
3. Click **Log In**.
4. Once authenticated, the extension will retrieve your user profile and automatically transition to the scraper dashboard.

### 3. Clip Jobs from LinkedIn
1. Navigate to any LinkedIn job details page (e.g., URLs matching `https://*.linkedin.com/jobs/view/*` or search result listings).
2. Click the extension icon.
3. Click **Scrape LinkedIn Page**. The parsed Job Title, Company, and Description will load into the popup.
4. Click **Save to Kanban Board**.
5. Navigate to your job tracker at `http://localhost:4000/applications` to view your newly saved application!

---

## Troubleshooting

- **Scrape button says "Ensure you are on a LinkedIn jobs details page and refresh..."**:
  - The script relies on the LinkedIn DOM structure. Ensure you are on a direct job view URL (`/jobs/view/` or similar) and reload the LinkedIn tab once after installing/reloading the extension so the content script can attach.
- **Connection Refused error on Save**:
  - Ensure your Spring Boot backend is active and running on `http://localhost:8080`.
