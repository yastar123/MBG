let _originalFetch: typeof window.fetch | null = null;
let _currentToken: string | null = null;

export function setupAuth() {
  _currentToken = localStorage.getItem("mbg_token");

  if (!_originalFetch) {
    _originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const isApiCall = typeof input === "string" && input.startsWith("/api");
      if (isApiCall && _currentToken) {
        init = init ?? {};
        init.headers = {
          ...init.headers,
          Authorization: `Bearer ${_currentToken}`,
        };
      }
      const response = await _originalFetch!(input, init);
      if (
        response.status === 401 &&
        isApiCall &&
        !input.toString().includes("/api/auth/login")
      ) {
        _currentToken = null;
        localStorage.removeItem("mbg_token");
        window.location.href = "/login";
      }
      return response;
    };
  }
}

export function setToken(token: string) {
  localStorage.setItem("mbg_token", token);
  _currentToken = token;
}

export function clearToken() {
  localStorage.removeItem("mbg_token");
  _currentToken = null;
  window.location.href = "/login";
}
