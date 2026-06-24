import axios from 'axios';

const rawApiUrl = String(process.env.REACT_APP_API_URL || '').trim();
const defaultApiUrl = 'http://localhost:5000/api';

const normalizeApiUrl = (value) => {
    if (!value) return defaultApiUrl;
    if (/^https?:\/\//i.test(value)) {
        const url = new URL(value);
        if (!url.pathname || url.pathname === '/') {
            url.pathname = '/api';
        }
        return url.toString().replace(/\/$/, '');
    }
    if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(value)) {
        return normalizeApiUrl(`http://${value}`);
    }
    if (/^[\w.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(value)) {
        return normalizeApiUrl(`https://${value}`);
    }

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

// --- SMART CACHING LAYER ---
const cache = new Map();
const CACHE_TTL = 45 * 1000; // 45 seconds cache

const getTagsFromUrl = (url) => {
    if (!url) return [];
    const tags = [];
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('/appointment')) tags.push('appointments');
    if (lowerUrl.includes('/profile') || lowerUrl.includes('/user')) tags.push('profile');
    if (lowerUrl.includes('/professional') || lowerUrl.includes('/pro')) tags.push('doctors');
    if (lowerUrl.includes('/stat')) tags.push('stats');
    if (lowerUrl.includes('/favorite')) tags.push('favorites');
    if (lowerUrl.includes('/notification')) tags.push('notifications');
    return tags;
};

export const clearApiCache = (tags = null) => {
    if (!tags) {
        cache.clear();
        return;
    }
    const tagsArray = Array.isArray(tags) ? tags : [tags];
    for (const [key, value] of cache.entries()) {
        if (value.tags.some(tag => tagsArray.includes(tag))) {
            cache.delete(key);
        }
    }
};

// Force refresh mechanism (can be attached to window or imported by components)
window.forceRefreshCache = () => clearApiCache();

// Override GET method for caching
const originalGet = api.get;
api.get = async (url, config = {}) => {
    // Don't cache blobs or explicit bypass requests
    if (config.bypassCache || config.responseType === 'blob') {
        return originalGet.call(api, url, config);
    }

    const cacheKey = `${url}?${JSON.stringify(config.params || {})}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        // Return cloned response to avoid reference mutations by components
        return Promise.resolve(JSON.parse(JSON.stringify(cachedData.response)));
    }

    const response = await originalGet.call(api, url, config);
    
    // Cache successful GET responses
    if (response.status >= 200 && response.status < 300) {
        cache.set(cacheKey, {
            timestamp: Date.now(),
            response: response,
            tags: getTagsFromUrl(url)
        });
    }

    return response;
};

// Intercept mutations to invalidate cache smartly
const handleMutation = async (originalMethod, isDelete, url, dataOrConfig, config) => {
    let response;
    if (isDelete) {
        response = await originalMethod.call(api, url, dataOrConfig); // delete(url, config)
    } else {
        response = await originalMethod.call(api, url, dataOrConfig, config); // post/put(url, data, config)
    }
    
    // Only clear cache on successful mutations
    if (response.status >= 200 && response.status < 300) {
        const tagsToClear = getTagsFromUrl(url);
        if (tagsToClear.length > 0) {
            clearApiCache(tagsToClear);
        } else {
            // Fallback: clear all if we can't determine the scope
            clearApiCache();
        }
    }
    return response;
};

const originalPost = api.post;
api.post = async (url, data, config) => handleMutation(originalPost, false, url, data, config);

const originalPut = api.put;
api.put = async (url, data, config) => handleMutation(originalPut, false, url, data, config);

const originalDelete = api.delete;
api.delete = async (url, config) => handleMutation(originalDelete, true, url, config);
// --- END SMART CACHING LAYER ---

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
