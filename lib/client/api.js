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
  if (!data.success) throw new ApiError(data.message || "Request failed", res.status, data.errors);
  return data;
}
