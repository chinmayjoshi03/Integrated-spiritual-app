import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="not-found">
      <h1 className="not-found-code">404</h1>
      <p className="not-found-message">
        We couldn't find the page you were looking for.
      </p>
      <Link to="/" className="not-found-link">
        Return Home
      </Link>
    </div>
  );
};

export default NotFoundPage;