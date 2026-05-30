import { useEffect } from "react";
import { useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react/src/custom-fetch";

// Setup global auth interceptor
export function setupAuth() {
  const token = localStorage.getItem("mbg_token");
  if (token) {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const isApiCall = typeof input === "string" && input.startsWith("/api");
      if (isApiCall) {
        init = init || {};
        init.headers = {
          ...init.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      const response = await originalFetch(input, init);
      if (response.status === 401 && isApiCall && !input.toString().includes("/api/auth/login")) {
        localStorage.removeItem("mbg_token");
        window.location.href = "/login";
      }
      return response;
    };
  }
}

export function setToken(token: string) {
  localStorage.setItem("mbg_token", token);
  setupAuth();
}

export function clearToken() {
  localStorage.removeItem("mbg_token");
  window.location.href = "/login";
}
