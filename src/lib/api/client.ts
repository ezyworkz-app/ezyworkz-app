import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

let baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
if (typeof window !== 'undefined') {
    baseApiUrl = ''; // Use relative URL in browser to hit Next.js rewrite proxy
}

// Automatically ensure the URL ends with /api/v1 so it works regardless of how it's defined in Vercel
if (baseApiUrl && !baseApiUrl.endsWith('/api/v1')) {
    baseApiUrl = baseApiUrl.replace(/\/$/, '') + '/api/v1';
} else if (!baseApiUrl) {
    baseApiUrl = '/api/v1';
}
const API_URL = baseApiUrl;

export const STORAGE_KEYS = {
    TOKEN: '@laundry_saas_token',
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

let logoutCallback: (() => void) | null = null;

// Expose interceptor setup to bind logout action dynamically
export const setupAxiosInterceptors = (onLogout: () => void) => {
    logoutCallback = onLogout;
};

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        try {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (error) {
            console.error('Error reading token from storage:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Helper to extract a human-readable error message from any error shape
export const getErrorMessage = (error: any): string => {
    if (!error) return 'Unknown error';

    if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') return data;
        if (data.message) return data.message;
        if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }

    if (error.code === 'ECONNABORTED') return 'Request timed out. Please check your connection.';
    if (error.message?.includes('Network Error')) return `Cannot reach server. Is the backend running?`;

    if (error.message) return error.message;
    return String(error);
};

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
    (response) => {
        if (response.data && typeof response.data === 'object' && response.data.success === true && 'data' in response.data) {
            return { ...response, data: response.data.data };
        }
        return response;
    },
    (error: AxiosError) => {
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const url = error.config?.url || 'unknown';

        if (error.response) {
            const statusCode = error.response.status;
            const serverMessage = getErrorMessage(error);

            if (statusCode === 403 || statusCode === 401) {
                if (!url.includes('/shop-auth/')) {
                    console.warn(`[${method} ${url}] Auth Error (${statusCode}) — ${serverMessage}. Forcing logout.`);
                    if (logoutCallback) {
                        logoutCallback();
                    } else if (typeof window !== 'undefined') {
                        localStorage.removeItem(STORAGE_KEYS.TOKEN);
                    }
                }
            }
            console.error(`API Error [${method} ${url}] ${statusCode}: ${serverMessage}`);
        } else if (error.request) {
            console.error(`Network Error [${method} ${url}]: Cannot reach server.`);
        } else {
            console.error(`Request Setup Error: ${error.message}`);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
