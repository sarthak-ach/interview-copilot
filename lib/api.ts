const API_BASE_URL = "http://localhost:8080";

export interface ApiOptions extends RequestInit {
  bodyData?: any;
}

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers || {});
  
  // Set content type to JSON by default if bodyData is provided
  if (options.bodyData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Inject token if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("interview-copilot-token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (options.bodyData) {
    fetchOptions.body = JSON.stringify(options.bodyData);
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      // Clear token and redirect to login if unauthorized (session expired)
      if (typeof window !== "undefined") {
        localStorage.removeItem("interview-copilot-token");
        localStorage.removeItem("interview-copilot-refresh-token");
        // Dispatch custom event to notify components
        window.dispatchEvent(new Event("auth-unauthorized"));
      }
    }

    if (!response.ok) {
      let errorMsg = "Something went wrong";
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (e) {
        // Fallback if not json
      }
      throw new Error(errorMsg);
    }

    // Handle empty response bodies
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json() as T;
    }
    
    return {} as T;
  } catch (error: any) {
    console.error(`API Error on ${path}:`, error);
    throw error;
  }
}
