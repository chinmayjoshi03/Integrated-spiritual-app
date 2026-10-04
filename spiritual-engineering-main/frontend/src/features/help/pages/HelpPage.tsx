import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  CircleHelp,
  Flower2,
  HeartHandshake,
  LifeBuoy,
  MessagesSquare,
  Search,
  Send,
  ThumbsDown,
  ThumbsUp,
  UserCog,
  Wrench,
} from 'lucide-react';

import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import { useAuth } from '@/hooks/useAuth';
import type { HelpCategory, HelpFaq } from '../types/help.types';
import { getHelpCategories, getHelpFaqs, searchHelp, submitFaqFeedback } from '../services/helpService';
import './help.css';

const ICONS: Record<string, typeof Calendar> = {
  Calendar,
  HeartHandshake,
  MessagesSquare,
  Flower2,
  BookOpen,
  UserCog,
  Wrench,
  CircleHelp,
};

type ChatItem =
  | { id: string; kind: 'assistant'; text: string }
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'faq'; faq: HelpFaq; feedback?: 'yes' | 'no' | 'error' }
  | { id: string; kind: 'empty' };

const HelpPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [faqs, setFaqs] = useState<HelpFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [chat, setChat] = useState<ChatItem[]>([
    {
      id: 'welcome',
      kind: 'assistant',
      text: "Hi! I'm here to help. What would you like to know?",
    },
  ]);
  const [draft, setDraft] = useState('');
  const [asking, setAsking] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [categoryRows, faqRows] = await Promise.all([
          getHelpCategories(),
          getHelpFaqs({ limit: 20 }),
        ]);
        setCategories(categoryRows);
        setFaqs(faqRows.faqs);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load the Help Centre.'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const run = async () => {
        try {
          const data = await getHelpFaqs({
            search: query.trim() || undefined,
            category: activeCategory || undefined,
            limit: 20,
          });
          setFaqs(data.faqs);
        } catch (err) {
          setError(getApiErrorMessage(err, 'Unable to search help articles.'));
        }
      };
      void run();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, activeCategory]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat]);

  const suggested = useMemo(() => faqs.slice(0, 6), [faqs]);

  const askQuestion = async (text: string) => {
    const question = text.trim();
    if (!question || asking) {
      return;
    }

    setAsking(true);
    setChat((current) => [
      ...current,
      { id: `u-${Date.now()}`, kind: 'user', text: question },
    ]);
    setDraft('');

    try {
      const matches = await searchHelp(question);
      if (matches.length === 0) {
        setChat((current) => [
          ...current,
          { id: `e-${Date.now()}`, kind: 'empty' },
        ]);
        return;
      }

      setChat((current) => [
        ...current,
        ...matches.slice(0, 2).map((faq) => ({
          id: `f-${faq.id}-${Date.now()}`,
          kind: 'faq' as const,
          faq,
        })),
      ]);
    } catch (err) {
      setChat((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          kind: 'assistant',
          text: getApiErrorMessage(err, 'I could not search the Help Centre just then.'),
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const sendFeedback = async (itemId: string, faq: HelpFaq, helpful: boolean) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/help' } });
      return;
    }

    try {
      await submitFaqFeedback(faq.id, helpful);
      setChat((current) =>
        current.map((item) =>
          item.id === itemId && item.kind === 'faq'
            ? { ...item, feedback: helpful ? 'yes' : 'no' }
            : item
        )
      );
    } catch {
      setChat((current) =>
        current.map((item) =>
          item.id === itemId && item.kind === 'faq' ? { ...item, feedback: 'error' } : item
        )
      );
    }
  };

  return (
    <div className="help-page">
      <p className="help-kicker">Help Centre</p>
      <h1 className="help-title">How can we help?</h1>
      <p className="help-lead">
        Search the knowledge base or ask the Help Assistant. Answers come only from published
        platform guides — never invented.
      </p>

      <form
        className="help-search"
        onSubmit={(event) => {
          event.preventDefault();
          void askQuestion(query || draft);
        }}
      >
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search questions, like “How do I register for an event?”"
          aria-label="Search help"
        />
      </form>

      {error ? <p className="help-error">{error}</p> : null}
      {loading ? <p className="help-state">Loading help articles…</p> : null}

      <div className="help-category-grid">
        <button
          type="button"
          className={!activeCategory ? 'is-active' : ''}
          onClick={() => setActiveCategory('')}
        >
          All
        </button>
        {categories.map((category) => {
          const Icon = ICONS[category.icon || ''] || CircleHelp;
          return (
            <button
              key={category.id}
              type="button"
              className={activeCategory === category.slug ? 'is-active' : ''}
              onClick={() => setActiveCategory(category.slug)}
            >
              <Icon size={16} />
              {category.name}
            </button>
          );
        })}
      </div>

      <section className="help-layout">
        <div className="help-chat-card">
          <div className="help-chat-header">
            <LifeBuoy size={18} />
            <div>
              <strong>Help Assistant</strong>
              <p>Answers from the platform knowledge base</p>
            </div>
          </div>
          <div className="help-chat-thread" ref={listRef}>
            {chat.map((item) => {
              if (item.kind === 'user') {
                return (
                  <div key={item.id} className="help-bubble is-user">
                    {item.text}
                  </div>
                );
              }
              if (item.kind === 'assistant') {
                return (
                  <div key={item.id} className="help-bubble is-assistant">
                    {item.text}
                  </div>
                );
              }
              if (item.kind === 'empty') {
                return (
                  <div key={item.id} className="help-bubble is-assistant">
                    <p>I couldn&apos;t find an exact answer to that yet.</p>
                    <p>Would you like to contact support?</p>
                    <Link
                      className="help-inline-btn"
                      to={isAuthenticated ? '/my-support/new' : '/login'}
                      state={isAuthenticated ? undefined : { from: '/my-support/new' }}
                    >
                      Create Support Request
                    </Link>
                  </div>
                );
              }
              return (
                <div key={item.id} className="help-bubble is-assistant">
                  <p>{item.faq.answer}</p>
                  {item.faq.category_slug === 'events' ? (
                    <Link className="help-inline-btn" to="/events">
                      Open Events →
                    </Link>
                  ) : null}
                  {item.faq.category_slug === 'volunteering' ? (
                    <Link className="help-inline-btn" to="/volunteering">
                      Open Volunteering →
                    </Link>
                  ) : null}
                  {item.faq.category_slug === 'community' ? (
                    <Link className="help-inline-btn" to="/community">
                      Open Community →
                    </Link>
                  ) : null}
                  {item.faq.category_slug === 'meditation' ? (
                    <Link className="help-inline-btn" to="/dashboard">
                      Open Dashboard →
                    </Link>
                  ) : null}
                  <div className="help-feedback">
                    <span>Was this helpful?</span>
                    {item.feedback === 'yes' || item.feedback === 'no' ? (
                      <em>Thank you.</em>
                    ) : (
                      <>
                        <button type="button" onClick={() => void sendFeedback(item.id, item.faq, true)}>
                          <ThumbsUp size={14} /> Yes
                        </button>
                        <button type="button" onClick={() => void sendFeedback(item.id, item.faq, false)}>
                          <ThumbsDown size={14} /> No
                        </button>
                      </>
                    )}
                    {item.feedback === 'error' ? <span className="help-error">Could not save feedback.</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
          <form
            className="help-chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void askQuestion(draft);
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask a short question"
              aria-label="Ask the Help Assistant"
            />
            <button type="submit" disabled={asking || !draft.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>

        <div>
          <h2 className="help-section-title">Suggested questions</h2>
          <div className="help-suggested">
            {suggested.map((faq) => (
              <button key={faq.id} type="button" onClick={() => void askQuestion(faq.question)}>
                {faq.question}
              </button>
            ))}
          </div>

          <h2 className="help-section-title">Frequently Asked Questions</h2>
          {!loading && faqs.length === 0 ? (
            <p className="help-state">No matching articles yet. Try another search or contact support.</p>
          ) : null}
          <ul className="help-faq-list">
            {faqs.map((faq) => (
              <li key={faq.id}>
                <details>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="help-support-banner">
        <div>
          <h2>Still need help?</h2>
          <p>Create a support request and our team will follow up in My Support.</p>
        </div>
        <Link
          to={isAuthenticated ? '/my-support/new' : '/login'}
          state={isAuthenticated ? undefined : { from: '/my-support/new' }}
          className="help-primary-btn"
        >
          Create Support Request
        </Link>
      </section>
    </div>
  );
};

export default HelpPage;
