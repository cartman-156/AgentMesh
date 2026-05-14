export type ApiRequestConfig = RequestInit & {
  headers?: Record<string, string>;
};

export type ApiResponse<T> = {
  data: T;
  status: number;
};

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
};

const attachAuthHeaders = (headers: Record<string, string>) => {
  // Placeholder for future Authorization header injection.
  return headers;
};

const buildHeaders = (headers?: Record<string, string>) => {
  return attachAuthHeaders({
    ...defaultHeaders,
    ...(headers ?? {}),
  });
};

const normalizeConfig = async (config?: ApiRequestConfig): Promise<RequestInit> => {
  const request = config ? { ...config } : {};
  request.headers = buildHeaders(request.headers as Record<string, string>);
  return request;
};

export const requestInterceptor = async (config?: ApiRequestConfig) => {
  return normalizeConfig(config);
};

export const responseInterceptor = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const payload = await response.text();
  const data = payload ? JSON.parse(payload) : null;

  if (!response.ok) {
    throw {
      status: response.status,
      data,
    };
  }

  return {
    data,
    status: response.status,
  };
};

const apiClient = {
  get: async <T>(path: string, config?: ApiRequestConfig) => {
    const request = await requestInterceptor(config);
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      ...request,
    });
    return responseInterceptor<T>(response);
  },

  post: async <T>(path: string, body?: unknown, config?: ApiRequestConfig) => {
    const request = await requestInterceptor(config);
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...request,
    });
    return responseInterceptor<T>(response);
  },

  put: async <T>(path: string, body?: unknown, config?: ApiRequestConfig) => {
    const request = await requestInterceptor(config);
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...request,
    });
    return responseInterceptor<T>(response);
  },

  delete: async <T>(path: string, config?: ApiRequestConfig) => {
    const request = await requestInterceptor(config);
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      ...request,
    });
    return responseInterceptor<T>(response);
  },
};

export default apiClient;
