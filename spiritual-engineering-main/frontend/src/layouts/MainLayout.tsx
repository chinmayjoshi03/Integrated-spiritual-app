import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar/Navbar';

const MainLayout = () => {
  return (
    <div>
      <header>
        <Navbar />
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        <p>© 2026 Spiritual Platform</p>
      </footer>
    </div>
  );
};

export default MainLayout;