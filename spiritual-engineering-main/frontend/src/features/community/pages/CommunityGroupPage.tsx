import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import AskQuestionForm from '../components/AskQuestionForm';
import CommunityQuestionCard from '../components/CommunityQuestionCard';
import CommunityShell from '../components/CommunityShell';
import {
  createGroupQuestion,
  getCommunityGroupById,
  getGroupQuestions,
  joinCommunityGroup,
  leaveCommunityGroup,
} from '../services/communityService';
import type {
  CommunityGroup,
  CommunityQuestionSummary,
} from '../types/community.types';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import './community.css';

const CommunityGroupPage = () => {
  const { id } = useParams();
  const groupId = Number(id);
  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [questions, setQuestions] = useState<CommunityQuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [membershipBusy, setMembershipBusy] = useState(false);
  const [membershipError, setMembershipError] = useState('');
  const [askError, setAskError] = useState('');
  const [askSuccess, setAskSuccess] = useState('');
  const [asking, setAsking] = useState(false);

  const canAsk = Boolean(group?.is_member);

  const loadGroup = useCallback(async () => {
    if (!Number.isInteger(groupId) || groupId <= 0) {
      setError('This group could not be found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [groupData, questionData] = await Promise.all([
        getCommunityGroupById(groupId),
        getGroupQuestions(groupId),
      ]);
      setGroup(groupData);
      setQuestions(questionData);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load this group.'));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  const handleJoin = async () => {
    if (!group || membershipBusy) {
      return;
    }

    setMembershipBusy(true);
    setMembershipError('');

    try {
      await joinCommunityGroup(group.id);
      setGroup({
        ...group,
        is_member: true,
        member_count: group.member_count + 1,
      });
    } catch (err) {
      setMembershipError(getApiErrorMessage(err, 'Unable to join this group.'));
    } finally {
      setMembershipBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!group || membershipBusy) {
      return;
    }

    setMembershipBusy(true);
    setMembershipError('');

    try {
      await leaveCommunityGroup(group.id);
      setGroup({
        ...group,
        is_member: false,
        member_count: Math.max(0, group.member_count - 1),
      });
    } catch (err) {
      setMembershipError(getApiErrorMessage(err, 'Unable to leave this group.'));
    } finally {
      setMembershipBusy(false);
    }
  };

  const handleAsk = async (title: string, content: string) => {
    if (!group) {
      return;
    }

    setAsking(true);
    setAskError('');
    setAskSuccess('');

    try {
      const result = await createGroupQuestion(group.id, { title, content });
      setAskSuccess(result.message);
      const refreshed = await getGroupQuestions(group.id);
      setQuestions(refreshed);
    } catch (err) {
      setAskError(getApiErrorMessage(err, 'Unable to share this question.'));
      throw err;
    } finally {
      setAsking(false);
    }
  };

  return (
    <CommunityShell>
      <Link to="/community" className="community-back">
        <ArrowLeft size={16} />
        Back to community
      </Link>

      {loading ? (
        <div className="community-state">
          <p>Loading this circle...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="community-state">
          <p className="community-error">{error}</p>
          <button type="button" className="community-retry" onClick={() => void loadGroup()}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && group ? (
        <>
          <div className="community-page-header">
            <p className="community-kicker">Community group</p>
            <h1 className="community-title">{group.name}</h1>
            {group.description ? (
              <p className="community-lead">{group.description}</p>
            ) : null}
            <p className="community-section-copy">{group.member_count} members</p>
            {membershipError ? <p className="community-error">{membershipError}</p> : null}
            {group.is_member ? (
              <button
                type="button"
                className="community-text-btn"
                onClick={() => void handleLeave()}
                disabled={membershipBusy}
              >
                {membershipBusy ? 'Leaving...' : 'Leave group'}
              </button>
            ) : (
              <button
                type="button"
                className="community-primary-btn"
                onClick={() => void handleJoin()}
                disabled={membershipBusy}
              >
                {membershipBusy ? 'Joining...' : 'Join group'}
              </button>
            )}
          </div>

          {canAsk ? (
            <section className="community-section">
              {askSuccess ? <p className="community-success">{askSuccess}</p> : null}
              <AskQuestionForm
                isSubmitting={asking}
                error={askError}
                onSubmit={async (title, content) => {
                  await handleAsk(title, content);
                }}
              />
            </section>
          ) : null}

          {!canAsk && !group.is_member ? (
            <p className="community-section-copy">Join this community to ask a question.</p>
          ) : null}

          <section className="community-section">
            <h2 className="community-section-title">Discussions</h2>
            {questions.length === 0 ? (
              <div className="community-empty">
                <p>No questions in this circle yet.</p>
              </div>
            ) : (
              <div className="community-stack">
                {questions.map((question) => (
                  <CommunityQuestionCard key={question.id} question={question} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </CommunityShell>
  );
};

export default CommunityGroupPage;
