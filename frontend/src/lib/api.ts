const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requireAuth = true, headers: customHeaders, ...fetchOptions } = options;
  
  const headers = new Headers(customHeaders);
  headers.set('Content-Type', 'application/json');

  if (requireAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let response: Response;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      headers,
      ...fetchOptions,
    });
  } catch (err) {
    if (baseUrl.includes("localhost")) {
      const fallbackUrl = baseUrl.replace("localhost", "127.0.0.1");
      response = await fetch(`${fallbackUrl}${endpoint}`, {
        headers,
        ...fetchOptions,
      });
    } else {
      throw err;
    }
  }

  const json = await response.json();

  if (!response.ok || (json && json.success === false)) {
    if (
      response.status === 401 && 
      typeof window !== 'undefined' && 
      !endpoint.includes('/auth/login') && 
      !endpoint.includes('/auth/register')
    ) {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      window.location.href = '/auth';
    }
    const errorMessage = json?.error || json?.detail || 'An unexpected error occurred';
    throw new ApiError(response.status, errorMessage, json?.details);
  }

  return json.data !== undefined ? json.data : json;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, data: any, options?: RequestOptions) => 
    fetchApi<T>(endpoint, { 
      ...options, 
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  put: <T>(endpoint: string, data: any, options?: RequestOptions) => 
    fetchApi<T>(endpoint, { 
      ...options, 
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};
