export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function api(path, { method = "GET", body, headers, signal } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      signal,
      headers: { ...(body && !isForm ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new ApiError("Network error. Check your connection and try again.", 0);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new ApiError("Unexpected response from the server", res.status);
  }
  if (!data.success) {
    // A session that is signed but revoked or deleted passes the proxy yet fails here. Clear the stale cookie and
    // go to login (not for login/register themselves, which also use 401 for bad credentials).
    const onAuthPage = /^\/(login|register)(\/|$)/.test(window.location.pathname);
    if (res.status === 401 && data.message === "Authentication required" && !onAuthPage) {
      const here = window.location.pathname + window.location.search;
      window.location.assign(`/api/auth/expired?next=${encodeURIComponent(here)}`);
      return new Promise(() => {}); // the page is navigating away
    }
    throw new ApiError(data.message || "Request failed", res.status, data.errors);
  }
  return data;
}
