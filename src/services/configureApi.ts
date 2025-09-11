import axios from 'axios';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Define response type
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor for authentication
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  response => {
    // Transform all responses to include success property
    if (response.data && typeof response.data === 'object') {
      if ('success' in response.data) {
        return response.data;
      }
      return {
        success: true,
        data: response.data
      } as ApiResponse;
    }
    // If response is not in expected format, return a standardized format
    return {
      success: true,
      data: response.data
    } as ApiResponse;
  },
  error => {
    console.error('API Error:', error);
    
    // Properly format error response
    const errorMessage = error.response?.data?.error || error.message || 'Something went wrong';
    
    // If we get a 401 Unauthorized error, clear the token
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

export default api; 