import { BadgeCheck } from 'lucide-react';
import './VerificationBadge.css';

const VerificationBadge = ({ verified, compact = false, className = '' }) => {
  if (!verified) return null;

  return (
    <span className={`verification-badge ${compact ? 'compact' : ''} ${className}`.trim()} title="Compte vérifié" aria-label="Compte vérifié">
      <BadgeCheck size={compact ? 13 : 14} aria-hidden="true" />
    </span>
  );
};

export default VerificationBadge;
