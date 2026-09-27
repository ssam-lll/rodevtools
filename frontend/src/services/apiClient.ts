
export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private formatUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    if (!params) return endpoint;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    if (!queryString) return endpoint;

    return endpoint.includes("?") ? `${endpoint}&${queryString}` : `${endpoint}?${queryString}`;
  }

  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { params, headers, body, ...customConfig } = options;
    const url = this.formatUrl(endpoint, params);

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...customConfig,
    };

    if (body && typeof body === "object" && !(body instanceof FormData)) {
      config.body = JSON.stringify(body);
    } else if (body) {
      config.body = body as BodyInit;
    }

    const response = await fetch(url, config);

    let data: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const record = (typeof data === "object" && data !== null) ? (data as Record<string, unknown>) : null;
      const errorMsg =
        (typeof record?.message === "string" ? record.message : null) ||
        (typeof record?.error === "string" ? record.error : null) ||
        (typeof data === "string" && data.trim().length > 0 ? data : null) ||
        `Request failed with status ${response.status}`;

      throw new ApiError(errorMsg, response.status, data);
    }

    return data as T;
  }

  get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  put<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
