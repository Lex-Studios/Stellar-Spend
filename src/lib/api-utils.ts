/**
 * Shared API utilities to reduce duplication
 */

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: string;
}

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
}

/**
 * Make an API request with error handling and timeout
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? `HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Make a GET request
 */
export async function apiGet<T>(
  endpoint: string,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: "GET" });
}

/**
 * Make a POST request
 */
export async function apiPost<T>(
  endpoint: string,
  body?: any,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Make a PUT request
 */
export async function apiPut<T>(
  endpoint: string,
  body?: any,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Make a DELETE request
 */
export async function apiDelete<T>(
  endpoint: string,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: "DELETE" });
}

/**
 * Extract error message from API response
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}
