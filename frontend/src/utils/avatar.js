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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const getAvatarSrc = (user) => {
  const avatarUrl = user?.avatar_url || '';
  if (!avatarUrl) return '';
  if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;
  if (avatarUrl.startsWith('/')) return `${API_ORIGIN}${avatarUrl}`;
  if (avatarUrl.startsWith('uploads/')) return `${API_ORIGIN}/${avatarUrl}`;
  return avatarUrl;
};
