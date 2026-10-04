import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, ArrowLeft } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { userNavSections } from '@/features/dashboard/userNavConfig';
import {
  getMeditationById,
  getProgress,
  updateProgress,
  getBookmarkStatus,
  toggleBookmark,
  type Meditation,
} from './meditationService';
import './MeditationPlayerPage.css';

const MeditationPlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  const [meditation, setMeditation] = useState<Meditation | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasResumed, setHasResumed] = useState(false);

  useEffect(() => {
    if (!id) return;

    getMeditationById(id).then(setMeditation);
    getBookmarkStatus(id).then(setIsBookmarked);
  }, [id]);

  const handleLoadedMetadata = async () => {
    if (!id || !mediaRef.current || hasResumed) return;

    const savedProgress = await getProgress(id);
    if (savedProgress && savedProgress.progress_seconds > 0) {
      mediaRef.current.currentTime = savedProgress.progress_seconds;
    }
    setHasResumed(true);
  };

  const handleTimeUpdate = () => {
    if (!id || !mediaRef.current) return;

    const current = Math.floor(mediaRef.current.currentTime);
    const total = Math.floor(mediaRef.current.duration || 0);
    const isNearEnd = total > 0 && current >= total - 2;

    if (current % 5 === 0) {
      updateProgress(id, current, isNearEnd);
    }
  };

  const handleEnded = () => {
    if (!id || !mediaRef.current) return;
    const total = Math.floor(mediaRef.current.duration || 0);
    updateProgress(id, total, true);
  };

  const handleBookmarkToggle = async () => {
    if (!id) return;
    const newStatus = await toggleBookmark(id);
    setIsBookmarked(newStatus);
  };

  if (!meditation) {
    return (
      <div className="dash-layout">
        <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />
        <main className="dash-main">
          <p className="admin-widget-subtext">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />

      <main className="dash-main">
        <DashboardHeader title={meditation.title} subtitle={meditation.category_name || 'Meditation'} />

        <Link to="/dashboard/meditation" className="dash-widget-link med-back-link">
          <ArrowLeft size={16} /> Back to Meditation
        </Link>

        <div className="med-player-card">
          {meditation.media_type === 'video' ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={meditation.media_url || undefined}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              className="med-player-media"
            />
          ) : (
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={meditation.media_url || undefined}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              className="med-player-media"
            />
          )}

          <div className="med-player-info">
            <div className="med-player-header-row">
              <h2 className="admin-widget-title">{meditation.title}</h2>
              <button onClick={handleBookmarkToggle} className="med-bookmark-btn" aria-label="Toggle bookmark">
                {isBookmarked ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}
              </button>
            </div>
            <p className="admin-widget-subtext">{meditation.description}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MeditationPlayerPage;