document.addEventListener("DOMContentLoaded", () => {
  // Views
  const loginView = document.getElementById("login-view");
  const dashboardView = document.getElementById("dashboard-view");
  const userProfile = document.getElementById("user-profile");
  const userNameSpan = document.getElementById("user-name");

  // Inputs & Buttons
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  
  const scrapeBtn = document.getElementById("scrape-btn");
  const saveBtn = document.getElementById("save-btn");
  
  const jobTitle = document.getElementById("job-title");
  const jobCompany = document.getElementById("job-company");
  const jobDesc = document.getElementById("job-desc");
  const statusBox = document.getElementById("status-box");

  const API_HOST = "http://localhost:8080";
  let scrapedData = null;

  // Status message helper
  const showStatus = (text, type) => {
    if (!text) {
      statusBox.style.display = "none";
      statusBox.textContent = "";
      statusBox.className = "status";
    } else {
      statusBox.textContent = text;
      statusBox.className = `status ${type}`;
      statusBox.style.display = "block";
    }
  };

  // Toggle View layout based on credentials presence
  const updateUIForLoginState = (accessToken, userId, userName) => {
    if (accessToken && userId) {
      loginView.style.display = "none";
      dashboardView.style.display = "flex";
      userProfile.style.display = "flex";
      userNameSpan.textContent = userName || "User";
    } else {
      loginView.style.display = "block";
      dashboardView.style.display = "none";
      userProfile.style.display = "none";
      userNameSpan.textContent = "";
      // Reset inputs
      loginPassword.value = "";
    }
  };

  // Initialize view from storage
  chrome.storage.local.get(["accessToken", "userId", "userName"], (res) => {
    updateUIForLoginState(res.accessToken, res.userId, res.userName);
  });

  // Handle Login Flow
  loginBtn.addEventListener("click", async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showStatus("Please enter both email and password.", "error");
      return;
    }

    showStatus("Logging in...", "success");
    loginBtn.disabled = true;

    try {
      // 1. Authenticate with local login
      const response = await fetch(`${API_HOST}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        let errData = "Invalid credentials";
        try {
          const errJson = await response.json();
          errData = errJson.error || errJson.message || errData;
        } catch (e) {}
        throw new Error(errData);
      }

      const data = await response.json();
      const token = data.access_token;

      // 2. Query user profile to fetch UUID User ID
      showStatus("Fetching user profile...", "success");
      const meResponse = await fetch(`${API_HOST}/api/users/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!meResponse.ok) {
        throw new Error("Failed to fetch user profile details.");
      }

      const meData = await meResponse.json();
      const userId = meData.id;
      const userName = meData.fullName;

      // 3. Persist details in local storage
      chrome.storage.local.set({
        accessToken: token,
        userId: userId,
        userName: userName
      }, () => {
        showStatus("Logged in successfully!", "success");
        setTimeout(() => showStatus("", ""), 1500);
        updateUIForLoginState(token, userId, userName);
        loginBtn.disabled = false;
      });

    } catch (err) {
      showStatus(err.message, "error");
      loginBtn.disabled = false;
    }
  });

  // Handle Logout Flow
  logoutBtn.addEventListener("click", () => {
    chrome.storage.local.remove(["accessToken", "userId", "userName"], () => {
      showStatus("Logged out successfully.", "success");
      setTimeout(() => showStatus("", ""), 1500);
      updateUIForLoginState(null, null, null);
      scrapedData = null;
      jobTitle.textContent = "Scrape LinkedIn page to load details.";
      jobCompany.textContent = "";
      jobDesc.textContent = "Navigate to a LinkedIn job view/details page and click Scrape.";
      saveBtn.disabled = true;
    });
  });

  // Handle Scrape Flow
  scrapeBtn.addEventListener("click", async () => {
    showStatus("Scraping page...", "success");
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      showStatus("No active window found.", "error");
      return;
    }

    if (!tab.url.includes("linkedin.com")) {
      showStatus("This tool only works on LinkedIn job details pages.", "error");
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "scrapeJob" }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus("Ensure you are on a LinkedIn jobs details page and refresh the page before trying again.", "error");
        return;
      }

      if (response && response.success) {
        scrapedData = response;
        jobTitle.textContent = response.title;
        jobCompany.textContent = response.company;
        jobDesc.textContent = response.description;
        saveBtn.disabled = false;
        showStatus("Successfully scraped job listing details!", "success");
      } else {
        showStatus(response ? response.error : "Failed to scrape job details.", "error");
      }
    });
  });

  // Handle Save Flow
  saveBtn.addEventListener("click", async () => {
    if (!scrapedData) return;

    chrome.storage.local.get(["accessToken", "userId"], async (res) => {
      const token = res.accessToken;
      const userId = res.userId;

      if (!token || !userId) {
        showStatus("Authentication credentials expired. Please log in again.", "error");
        updateUIForLoginState(null, null, null);
        return;
      }

      showStatus("Saving to Kanban board...", "success");
      saveBtn.disabled = true;

      try {
        // 1. Create Job Description in backend
        const jdResponse = await fetch(`${API_HOST}/api/jobs/descriptions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: userId,
            title: `${scrapedData.company} - ${scrapedData.title}`,
            description: scrapedData.description
          })
        });

        if (!jdResponse.ok) {
          const err = await jdResponse.text();
          throw new Error(`Failed to create JD: ${err}`);
        }

        const jdData = await jdResponse.json();

        // 2. Add application card to Kanban in backend
        const appResponse = await fetch(`${API_HOST}/api/applications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: userId,
            companyName: scrapedData.company,
            roleName: scrapedData.title,
            status: "Saved",
            notes: "Logged automatically via Interview Copilot Clipper Extension.",
            jobDescriptionId: jdData.id
          })
        });

        if (!appResponse.ok) {
          const err = await appResponse.text();
          throw new Error(`Failed to save application: ${err}`);
        }

        showStatus("Successfully saved to Kanban board!", "success");
        saveBtn.disabled = true;
      } catch (e) {
        showStatus(e.message, "error");
        saveBtn.disabled = false;
      }
    });
  });
});
