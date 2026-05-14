import type { ApiRequestConfig, ApiResponse } from './apiClient';

export const requestInterceptor = async (config?: ApiRequestConfig): Promise<ApiRequestConfig | undefined> => {
  // Placeholder for request interceptor behavior.
  // Future auth tokens, API keys, and retry logic can be added here.
  return config;
};

export const responseInterceptor = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  // Placeholder for response handling.
  // Future response transformation and error mapping can be added here.
  return {
    data,
    status: response.status,
  };
};
