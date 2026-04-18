import axios from 'axios';

const rawApiUrl = String(process.env.REACT_APP_API_URL || '').trim();
const defaultApiUrl = 'http://localhost:5000/api';

const normalizeApiUrl = (value) => {
    if (!value) return defaultApiUrl;
    if (/^https?:\/\//i.test(value)) return value;

    const normalizedPath = value.startsWith('/') ? value : `/${value}`;
    return `http://localhost:5000${normalizedPath}`;
};

const resolvedApiUrl = normalizeApiUrl(rawApiUrl);

const api = axios.create({
    baseURL: resolvedApiUrl,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

const REFRESH_BUFFER_MS = 30 * 1000;
let refreshPromise = null;

export const clearAuthStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('user');
};

export const persistAuthSession = ({ token, refreshToken, expiresAt, user }) => {
    if (token) {
        localStorage.setItem('token', token);
    }

    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    }

    if (expiresAt) {
        localStorage.setItem('tokenExpiresAt', String(expiresAt));
    }

    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    }
};

const getStoredExpiryMs = () => {
    const expiresAt = Number(localStorage.getItem('tokenExpiresAt') || 0);
    return expiresAt > 0 ? expiresAt * 1000 : 0;
};

export const shouldRefreshSession = () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const expiryMs = getStoredExpiryMs();

    if (!token || !refreshToken) return false;
    if (!expiryMs) return false;

    return Date.now() >= (expiryMs - REFRESH_BUFFER_MS);
};

export const refreshAuthSession = async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
        throw new Error('Missing refresh token');
    }

    if (!refreshPromise) {
        refreshPromise = axios.post(
            `${resolvedApiUrl}/auth/refresh`,
            { refreshToken: storedRefreshToken },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            }
        )
            .then(({ data }) => {
                persistAuthSession(data);
                return data.token;
            })
            .catch((error) => {
                clearAuthStorage();
                throw error;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

api.interceptors.request.use(async (config) => {
    if (config.url?.includes('/auth/refresh')) {
        return config;
    }

    if (shouldRefreshSession()) {
        try {
            await refreshAuthSession();
        } catch {
            clearAuthStorage();
        }
    }

    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config || {};
        const shouldHandle401 = error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh');

        if (shouldHandle401 && localStorage.getItem('refreshToken')) {
            originalRequest._retry = true;

            try {
                const token = await refreshAuthSession();
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch {
                clearAuthStorage();
            }
        }

        if (error.response?.status === 401) {
            clearAuthStorage();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
