import { Link } from 'react-router-dom';
import './OfferingsTeaser.css';

interface Offering {
  id: string;
  title: string;
  description: string;
  link: string;
}

const offerings: Offering[] = [
  {
    id: 'courses',
    title: 'Courses',
    description: 'Structured programs to guide your inner journey, taught by experienced mentors.',
    link: '/courses',
  },
  {
    id: 'meditation',
    title: 'Meditation',
    description: 'Guided sessions to help you build a consistent, calming daily practice.',
    link: '/meditation',
  },
  {
    id: 'events',
    title: 'Events',
    description: 'Join live gatherings, retreats, and workshops happening near you.',
    link: '/events',
  },
];

const OfferingsTeaser = () => {
  return (
    <section className="offerings">
      <h2 className="offerings-title">Explore What We Offer</h2>

      <div className="offerings-grid">
        {offerings.map((offering) => (
          <Link to={offering.link} key={offering.id} className="offering-card">
            <h3 className="offering-card-title">{offering.title}</h3>
            <p className="offering-card-description">{offering.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default OfferingsTeaser;