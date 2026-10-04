import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

import type { CommunityGroup } from '../types/community.types';
import './CommunityGroupCard.css';

interface CommunityGroupCardProps {
  group: CommunityGroup;
  busy: boolean;
  onJoin: (group: CommunityGroup) => void;
  onLeave: (group: CommunityGroup) => void;
}

const CommunityGroupCard = ({
  group,
  busy,
  onJoin,
  onLeave,
}: CommunityGroupCardProps) => {
  return (
    <article className="community-group-card">
      <div className="community-group-card-top">
        <Users size={18} />
        <span>
          {group.member_count} members
          {typeof group.question_count === 'number'
            ? ` · ${group.question_count} discussions`
            : ''}
        </span>
      </div>
      {group.category ? (
        <p className="community-group-card-copy">{group.category}</p>
      ) : null}
      <h3 className="community-group-card-title">{group.name}</h3>
      {group.description ? (
        <p className="community-group-card-copy">{group.description}</p>
      ) : null}
      <div className="community-group-card-actions">
        <Link to={`/community/groups/${group.id}`} className="community-secondary-btn">
          Open group
        </Link>
        {group.is_member ? (
          <button
            type="button"
            className="community-text-btn"
            onClick={() => onLeave(group)}
            disabled={busy}
          >
            {busy ? 'Leaving...' : 'Leave'}
          </button>
        ) : (
          <button
            type="button"
            className="community-primary-btn"
            onClick={() => onJoin(group)}
            disabled={busy}
          >
            {busy ? 'Joining...' : 'Join'}
          </button>
        )}
      </div>
    </article>
  );
};

export default CommunityGroupCard;
