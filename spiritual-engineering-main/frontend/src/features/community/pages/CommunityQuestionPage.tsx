import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import CommunityReplyList from '../components/CommunityReplyList';
import CommunityShell from '../components/CommunityShell';
import MentorReplyForm from '../components/MentorReplyForm';
import {
  createQuestionReply,
  getCommunityGroupById,
  getQuestionById,
} from '../services/communityService';
import type { CommunityQuestionDetail } from '../types/community.types';
import { formatCommunityDate } from '../utils/formatCommunityDate';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import { useAuth } from '@/hooks/useAuth';
import './community.css';

const CommunityQuestionPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const questionId = Number(id);
  const [question, setQuestion] = useState<CommunityQuestionDetail | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyError, setReplyError] = useState('');
  const [replySuccess, setReplySuccess] = useState('');
  const [replying, setReplying] = useState(false);

  const loadQuestion = useCallback(async () => {
    if (!Number.isInteger(questionId) || questionId <= 0) {
      setError('This discussion could not be found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getQuestionById(questionId);
      setQuestion(data);

      try {
        const group = await getCommunityGroupById(data.group_id);
        setIsMember(group.is_member);
      } catch {
        setIsMember(false);
      }
    } catch (err) {
      setQuestion(null);
      setError(getApiErrorMessage(err, 'Unable to load this discussion.'));
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    void loadQuestion();
  }, [loadQuestion]);

  const handleReply = async (content: string) => {
    if (!question) {
      return;
    }

    setReplying(true);
    setReplyError('');
    setReplySuccess('');

    try {
      const result = await createQuestionReply(question.id, content);
      setReplySuccess(result.message);
      setQuestion({
        ...question,
        reply_count: question.reply_count + 1,
        replies: [...question.replies, { ...result.reply, replies: [] }],
      });
    } catch (err) {
      setReplyError(getApiErrorMessage(err, 'Unable to share this reply.'));
      throw err;
    } finally {
      setReplying(false);
    }
  };

  const canReply = isMember;

  return (
    <CommunityShell>
      {question ? (
        <Link to={`/community/groups/${question.group_id}`} className="community-back">
          <ArrowLeft size={16} />
          Back to {question.group_name}
        </Link>
      ) : (
        <Link to="/community" className="community-back">
          <ArrowLeft size={16} />
          Back to community
        </Link>
      )}

      {loading ? (
        <div className="community-state">
          <p>Loading this discussion...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="community-state">
          <p className="community-error">{error}</p>
          <button type="button" className="community-retry" onClick={() => void loadQuestion()}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && question ? (
        <>
          <article className="community-detail">
            <p className="community-kicker">{question.group_name}</p>
            <h1 className="community-detail-title">{question.title}</h1>
            <p className="community-detail-meta">
              {question.author.name}
              {question.author.role === 'mentor' ? ' · Mentor' : ''}
              {question.author.role === 'admin' ? ' · Admin' : ''}
              {` · ${formatCommunityDate(question.created_at)}`}
            </p>
            <p>{question.content}</p>
          </article>

          <section className="community-section">
            <h2 className="community-section-title">Answers</h2>
            <CommunityReplyList
              replies={question.replies}
              canComment={canReply}
              onComment={async (parentId, content) => {
                const result = await createQuestionReply(question.id, content, parentId);
                const refreshed = await getQuestionById(question.id);
                setQuestion(refreshed);
                setReplySuccess(result.message);
              }}
            />
          </section>

          {user && !isMember ? (
            <p className="community-section-copy">
              Join this community to answer or continue the discussion.
            </p>
          ) : null}

          {canReply ? (
            <section className="community-section">
              {replySuccess ? <p className="community-success">{replySuccess}</p> : null}
              <MentorReplyForm
                isSubmitting={replying}
                error={replyError}
                onSubmit={handleReply}
              />
            </section>
          ) : null}
        </>
      ) : null}
    </CommunityShell>
  );
};

export default CommunityQuestionPage;
