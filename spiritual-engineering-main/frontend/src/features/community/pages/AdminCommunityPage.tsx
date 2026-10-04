import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import AdminEventsShell from '@/features/events/components/AdminEventsShell';
import {
  adminGetCommunities,
  adminGetCommunity,
  adminGetQuestion,
  adminRemoveQuestion,
  adminRemoveReply,
  adminUpdateCommunityStatus,
} from '../services/communityService';
import type {
  CommunityGroup,
  CommunityQuestionDetail,
  CommunityQuestionSummary,
  CommunityStatus,
} from '../types/community.types';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import './community.css';
import '@/features/events/pages/AdminEventManagePage.css';

const AdminCommunityPage = () => {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<
    (CommunityGroup & { questions: CommunityQuestionSummary[] }) | null
  >(null);
  const [question, setQuestion] = useState<CommunityQuestionDetail | null>(null);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await adminGetCommunities(search, status);
      setGroups(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Please log in to manage community.');
      } else if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('You do not have permission to moderate community.');
      } else {
        setError(getApiErrorMessage(err, 'Unable to load communities.'));
      }
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const openGroup = async (groupId: number) => {
    setSelectedId(groupId);
    setQuestion(null);
    setNotice('');

    try {
      const data = await adminGetCommunity(groupId);
      setSelected(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to inspect this community.'));
    }
  };

  const updateStatus = async (groupId: number, next: CommunityStatus) => {
    setNotice('');
    try {
      await adminUpdateCommunityStatus(groupId, next);
      setNotice('Community status updated.');
      await loadGroups();
      if (selectedId === groupId) {
        await openGroup(groupId);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update this community.'));
    }
  };

  const removeQuestion = async (questionId: number) => {
    try {
      await adminRemoveQuestion(questionId);
      setNotice('Question removed from public view.');
      if (selectedId) {
        await openGroup(selectedId);
      }
      setQuestion(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to remove this question.'));
    }
  };

  const inspectQuestion = async (questionId: number) => {
    try {
      const data = await adminGetQuestion(questionId);
      setQuestion(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load this discussion.'));
    }
  };

  const removeReply = async (replyId: number) => {
    try {
      await adminRemoveReply(replyId);
      setNotice('Reply removed from public view.');
      if (question) {
        await inspectQuestion(question.id);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to remove this reply.'));
    }
  };

  return (
    <AdminEventsShell>
      <p className="community-kicker">Admin</p>
      <h1 className="community-title">Community moderation</h1>
      <p className="community-lead">
        View, archive, restore, and remove communities and discussions. Historical
        records are kept.
      </p>

      {loading ? <p className="community-section-copy">Loading communities...</p> : null}
      {error ? <p className="community-error">{error}</p> : null}
      {notice ? <p className="community-success">{notice}</p> : null}

      <div className="admin-event-manage-tabs">
        <input
          className="community-input"
          placeholder="Search communities"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="community-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="removed">Removed</option>
        </select>
      </div>

      {!loading && groups.length === 0 ? (
        <p className="community-section-copy">No communities found.</p>
      ) : (
        <div className="admin-event-manage-table-wrap">
          <table className="admin-event-manage-table">
            <thead>
              <tr>
                <th>Community</th>
                <th>Status</th>
                <th>Members</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td>{group.name}</td>
                  <td>{group.status ?? (group.is_active ? 'active' : 'archived')}</td>
                  <td>{group.member_count}</td>
                  <td className="admin-event-manage-actions">
                    <button type="button" onClick={() => void openGroup(group.id)}>
                      Inspect
                    </button>
                    {group.status !== 'archived' ? (
                      <button
                        type="button"
                        onClick={() => void updateStatus(group.id, 'archived')}
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void updateStatus(group.id, 'active')}
                      >
                        Restore
                      </button>
                    )}
                    {group.status !== 'removed' ? (
                      <button
                        type="button"
                        onClick={() => void updateStatus(group.id, 'removed')}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void updateStatus(group.id, 'active')}
                      >
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <section className="community-section">
          <h2 className="community-section-title">{selected.name}</h2>
          <p className="community-section-copy">{selected.description}</p>
          <p className="community-section-copy">
            Status: {selected.status} · {selected.member_count} members
          </p>
          {selected.questions.length === 0 ? (
            <p className="community-section-copy">No questions in this community.</p>
          ) : (
            <ul className="community-stack">
              {selected.questions.map((item) => (
                <li key={item.id} className="community-question-card">
                  <strong>
                    {item.title} {item.status === 'removed' ? '(removed)' : ''}
                  </strong>
                  <p>{item.author.name}</p>
                  <div className="admin-event-manage-actions">
                    <button type="button" onClick={() => void inspectQuestion(item.id)}>
                      Inspect
                    </button>
                    {item.status !== 'removed' ? (
                      <button type="button" onClick={() => void removeQuestion(item.id)}>
                        Remove question
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {question ? (
        <section className="community-section">
          <h2 className="community-section-title">{question.title}</h2>
          <p>{question.content}</p>
          <ul className="community-stack">
            {question.replies.map((reply) => (
              <li key={reply.id} className="community-reply">
                <strong>
                  {reply.author.name} {reply.status === 'removed' ? '(removed)' : ''}
                </strong>
                <p>{reply.content}</p>
                {reply.status !== 'removed' ? (
                  <button type="button" onClick={() => void removeReply(reply.id)}>
                    Remove reply
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <Link to="/community" className="community-back">
            Open public community
          </Link>
        </section>
      ) : null}
    </AdminEventsShell>
  );
};

export default AdminCommunityPage;
