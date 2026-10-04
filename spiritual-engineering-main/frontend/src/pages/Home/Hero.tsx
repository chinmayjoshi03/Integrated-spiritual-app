import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <h1 className="hero-title">Find Stillness. Discover Purpose.</h1>
      <p className="hero-subtitle">
        Join a global community exploring meditation, mindful living, and
        inner transformation.
      </p>
      <Link to="/courses" className="hero-cta">
        Explore Courses
      </Link>
    </section>
  );
};

export default Hero;