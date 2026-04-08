import { getAvatarSrc, getUserInitials } from '../../utils/avatar';
import './UserAvatar.css';

const UserAvatar = ({ user, fallback = 'US', className = '', style }) => {
  const avatarSrc = getAvatarSrc(user);
  const initials = getUserInitials(user, fallback);

  return (
    <div className={`user-avatar ${className}`.trim()} style={style}>
      {avatarSrc ? <img src={avatarSrc} alt={user?.name || 'Avatar'} /> : initials}
    </div>
  );
};

export default UserAvatar;
