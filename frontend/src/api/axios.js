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

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;