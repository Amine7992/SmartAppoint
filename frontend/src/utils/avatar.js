export const getUserInitials = (user, fallback = 'US') => {
  const prenom = user?.prenom || '';
  const nom = user?.nom || '';
  const initials = `${prenom.trim().charAt(0)}${nom.trim().charAt(0)}`.toUpperCase();

  if (initials.trim()) return initials;

  const nameInitials = user?.name
    ? user.name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return nameInitials || fallback;
};

const normalizeApiUrl = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'http://localhost:5000/api';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(trimmed)) return `http://${trimmed}`;
  if (/^[\w.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return `http://localhost:5000${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
};

const API_BASE_URL = normalizeApiUrl(process.env.REACT_APP_API_URL);
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const getAvatarSrc = (user) => {
  const avatarUrl = user?.avatar_url || '';
  if (!avatarUrl) return '';
  if (/^https?:\/\/localhost(?::\d+)?\//i.test(avatarUrl)) {
    const normalizedPath = avatarUrl.replace(/^https?:\/\/localhost(?::\d+)?/i, '');
    return `${API_ORIGIN}${normalizedPath}`;
  }
  if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;
  if (avatarUrl.startsWith('/')) return `${API_ORIGIN}${avatarUrl}`;
  if (avatarUrl.startsWith('uploads/')) return `${API_ORIGIN}/${avatarUrl}`;
  return avatarUrl;
};
