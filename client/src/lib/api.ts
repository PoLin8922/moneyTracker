// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function getApiUrl(path: string): string {
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If API_BASE_URL is empty, use relative path (for development)
  if (!API_BASE_URL) {
    return `/${cleanPath}`;
  }
  
  // Otherwise, use the full URL (for production)
  return `${API_BASE_URL}/${cleanPath}`;
}

// Helper function for API requests
export async function apiRequest(path: string, options?: RequestInit) {
  const url = getApiUrl(path);
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Important: send cookies for session
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response;
}
