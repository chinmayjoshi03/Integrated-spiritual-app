import { useState } from 'react';

import type { CommunityReply } from '../types/community.types';
import { formatCommunityDate } from '../utils/formatCommunityDate';
import './CommunityReplyList.css';

interface CommunityReplyListProps {
  replies: CommunityReply[];
  canComment?: boolean;
  onComment?: (parentId: number, content: string) => Promise<void>;
}

const AuthorBadge = ({ role }: { role: CommunityReply['author']['role'] }) => {
  if (role === 'mentor') {
    return <span className="community-mentor-badge">Mentor</span>;
  }

  if (role === 'admin') {
    return <span className="community-mentor-badge">Admin</span>;
  }

  return null;
};

const CommunityReplyList = ({
  replies,
  canComment = false,
  onComment,
}: CommunityReplyListProps) => {
  const [openId, setOpenId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  if (replies.length === 0) {
    return (
      <p className="community-empty-copy">
        No answers yet. Members, mentors, and admins can all share a response.
      </p>
    );
  }

  return (
    <ul className="community-reply-list">
      {replies.map((reply) => (
        <li
          key={reply.id}
          className={
            reply.author.role === 'mentor'
              ? 'community-reply community-reply-mentor'
              : 'community-reply'
          }
        >
          <div className="community-reply-meta">
            <strong>{reply.author.name}</strong>
            <AuthorBadge role={reply.author.role} />
            <span>{formatCommunityDate(reply.created_at)}</span>
          </div>
          <p>{reply.content}</p>
          {canComment ? (
            <button
              type="button"
              className="community-text-btn"
              onClick={() => setOpenId(openId === reply.id ? null : reply.id)}
            >
              Discuss
            </button>
          ) : null}
          {openId === reply.id ? (
            <form
              className="community-comment-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!onComment || !draft.trim()) {
                  return;
                }
                setBusyId(reply.id);
                void onComment(reply.id, draft.trim())
                  .then(() => {
                    setDraft('');
                    setOpenId(null);
                  })
                  .finally(() => setBusyId(null));
              }}
            >
              <textarea
                className="community-textarea"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={5000}
              />
              <button
                type="submit"
                className="community-primary-btn"
                disabled={busyId === reply.id}
              >
                {busyId === reply.id ? 'Sharing...' : 'Share comment'}
              </button>
            </form>
          ) : null}
          {reply.replies && reply.replies.length > 0 ? (
            <ul className="community-reply-list community-reply-nested">
              {reply.replies.map((comment) => (
                <li key={comment.id} className="community-reply">
                  <div className="community-reply-meta">
                    <strong>{comment.author.name}</strong>
                    <AuthorBadge role={comment.author.role} />
                    <span>{formatCommunityDate(comment.created_at)}</span>
                  </div>
                  <p>{comment.content}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
};

export default CommunityReplyList;
