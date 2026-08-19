import { getApiBaseUrl } from "@/constants/network";

/** A small unauthenticated API helper for optional local companion services. */
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  const baseUrl = getApiBaseUrl();
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const response = await fetch(baseUrl ? `${cleanBaseUrl}${cleanEndpoint}` : endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API call failed: ${response.statusText}`);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}
