console.log("Interview Copilot Content Script Loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeJob") {
    try {
      // 1. Scrape Job Title
      let title = "";
      const titleEl = document.querySelector(".job-details-jobs-unified-top-card__job-title") || 
                      document.querySelector(".jobs-unified-top-card__job-title h1") ||
                      document.querySelector("h1") ||
                      document.querySelector(".jobs-unified-top-card__job-title");
      if (titleEl) title = titleEl.innerText.trim();

      // 2. Scrape Company Name
      let company = "";
      const companyEl = document.querySelector(".job-details-jobs-unified-top-card__company-name") || 
                        document.querySelector(".jobs-unified-top-card__company-name") ||
                        document.querySelector(".jobs-unified-top-card__company-name a");
      if (companyEl) company = companyEl.innerText.trim();

      // 3. Scrape Job Description
      let description = "";
      const descEl = document.getElementById("job-details") || 
                     document.querySelector(".jobs-description__content") ||
                     document.querySelector(".jobs-box__html-content");
      if (descEl) description = descEl.innerText.trim();

      sendResponse({
        success: true,
        title: title || "Unknown Role",
        company: company || "Unknown Company",
        description: description || "No description found."
      });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
  }
  return true; // Keep message channel open for async response
});
