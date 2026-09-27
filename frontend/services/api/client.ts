/**
 * API client. Used only when NEXT_PUBLIC_DATA_MODE=api.
 * Components never import this. Services do.
 */
import { API_URL } from "@/config/app";
import { toSearchParams } from "@/services/query";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(method: string, path: string, body?: unknown, query?: object): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, "NO_API_URL", "NEXT_PUBLIC_API_URL is not set. Use DATA_MODE=mock or set the URL.");
  }
  const qs = query ? `?${toSearchParams(query).toString()}` : "";
  const res = await fetch(`${API_URL.replace(/\/$/, "")}${path}${qs}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    // TODO(backend): attach the Firebase ID token (Authorization: Bearer) once Firebase Auth is connected (Q6).
    // The server still verifies the token and checks ownership on every request; this header is not the security.
  });
  if (!res.ok) {
    let code = "HTTP_ERROR";
    let message = res.statusText;
    try {
      const err = await res.json();
      code = err?.error?.code ?? code;
      message = err?.error?.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, code, message);
  }
  return (await res.json()) as T;
}

export const apiGet = <T>(path: string, query?: object) => request<T>("GET", path, undefined, query);
export const apiPost = <T>(path: string, body?: unknown) => request<T>("POST", path, body);
export const apiPatch = <T>(path: string, body?: unknown) => request<T>("PATCH", path, body);
export const apiPut = <T>(path: string, body?: unknown) => request<T>("PUT", path, body);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);
