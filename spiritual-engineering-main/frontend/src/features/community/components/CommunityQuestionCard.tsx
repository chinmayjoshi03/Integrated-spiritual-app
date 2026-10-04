import { Link } from 'react-router-dom';

import type { CommunityQuestionSummary } from '../types/community.types';
import { formatCommunityDate } from '../utils/formatCommunityDate';
import './CommunityQuestionCard.css';

interface CommunityQuestionCardProps {
  question: CommunityQuestionSummary;
}

const CommunityQuestionCard = ({ question }: CommunityQuestionCardProps) => {
  return (
    <article className="community-question-card">
      <h3 className="community-question-card-title">
        <Link to={`/community/questions/${question.id}`}>{question.title}</Link>
      </h3>
      <p className="community-question-card-meta">
        {question.author.name}
        {question.author.role === 'mentor' ? ' · Mentor' : ''}
        {question.group_name ? ` · ${question.group_name}` : ''}
        {` · ${formatCommunityDate(question.created_at)}`}
        {` · ${question.reply_count} ${question.reply_count === 1 ? 'reply' : 'replies'}`}
      </p>
      <p className="community-question-card-copy">{question.content}</p>
      <Link to={`/community/questions/${question.id}`} className="community-question-card-link">
        Open discussion
      </Link>
    </article>
  );
};

export default CommunityQuestionCard;
