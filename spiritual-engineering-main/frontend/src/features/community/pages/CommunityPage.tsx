import { useCallback, useEffect, useState } from 'react';

import CommunityGroupCard from '../components/CommunityGroupCard';
import CommunityQuestionCard from '../components/CommunityQuestionCard';
import CommunityShell from '../components/CommunityShell';
import CreateCommunityForm from '../components/CreateCommunityForm';
import {
  getCommunityGroups,
  getRecentQuestions,
  joinCommunityGroup,
  leaveCommunityGroup,
} from '../services/communityService';
import type {
  CommunityGroup,
  CommunityQuestionSummary,
} from '../types/community.types';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import './community.css';

const CommunityPage = () => {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [questions, setQuestions] = useState<CommunityQuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyGroupId, setBusyGroupId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const loadCommunity = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [groupData, questionData] = await Promise.all([
        getCommunityGroups(),
        getRecentQuestions(),
      ]);
      setGroups(groupData);
      setQuestions(questionData);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load the community.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCommunity();
  }, [loadCommunity]);

  const handleJoin = async (group: CommunityGroup) => {
    if (busyGroupId !== null) {
      return;
    }

    setBusyGroupId(group.id);
    setActionError('');

    try {
      await joinCommunityGroup(group.id);
      setGroups((current) =>
        current.map((item) =>
          item.id === group.id
            ? { ...item, is_member: true, member_count: item.member_count + 1 }
            : item
        )
      );
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to join this group.'));
    } finally {
      setBusyGroupId(null);
    }
  };

  const handleLeave = async (group: CommunityGroup) => {
    if (busyGroupId !== null) {
      return;
    }

    setBusyGroupId(group.id);
    setActionError('');

    try {
      await leaveCommunityGroup(group.id);
      setGroups((current) =>
        current.map((item) =>
          item.id === group.id
            ? {
                ...item,
                is_member: false,
                member_count: Math.max(0, item.member_count - 1),
              }
            : item
        )
      );
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to leave this group.'));
    } finally {
      setBusyGroupId(null);
    }
  };

  const query = search.trim().toLowerCase();
  const visibleGroups = groups.filter((group) => {
    if (!query) {
      return true;
    }

    return (
      group.name.toLowerCase().includes(query) ||
      (group.description ?? '').toLowerCase().includes(query) ||
      (group.category ?? '').toLowerCase().includes(query)
    );
  });

  return (
    <CommunityShell>
      <div className="community-page-header">
        <p className="community-kicker">Sangha</p>
        <h1 className="community-title">Community</h1>
        <p className="community-lead">
          Sit with fellow seekers in shared circles of practice, study, and
          sincere questions. Everyone may ask, answer, and discuss.
        </p>
      </div>

      {loading ? (
        <div className="community-state">
          <p>Opening the community...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="community-state">
          <p className="community-error">{error}</p>
          <button type="button" className="community-retry" onClick={() => void loadCommunity()}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          {actionError ? <p className="community-error">{actionError}</p> : null}

          <section className="community-section">
            <CreateCommunityForm onCreated={() => void loadCommunity()} />
          </section>

          <section className="community-section">
            <h2 className="community-section-title">Communities</h2>
            <p className="community-section-copy">
              Search, join, or open a circle. You may leave at any time.
            </p>
            <input
              className="community-input"
              placeholder="Search communities"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {visibleGroups.length === 0 ? (
              <div className="community-empty">
                <p>No communities match that search.</p>
              </div>
            ) : (
              <div className="community-grid">
                {visibleGroups.map((group) => (
                  <CommunityGroupCard
                    key={group.id}
                    group={group}
                    busy={busyGroupId === group.id}
                    onJoin={(item) => {
                      void handleJoin(item);
                    }}
                    onLeave={(item) => {
                      void handleLeave(item);
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="community-section">
            <h2 className="community-section-title">Recent discussions</h2>
            <p className="community-section-copy">
              Questions from the community. Anyone may answer.
            </p>
            {questions.length === 0 ? (
              <div className="community-empty">
                <p>No discussions yet. Join a group and ask with sincerity.</p>
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

export default CommunityPage;
