import { useState } from 'react';
import './widgets.css';

const moods = ['😊', '😐', '😔', '😡', '😴'];

const MoodWidget = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  return (
    <div className="widget-card">
      <h3 className="widget-title">How are you feeling today?</h3>
      <div style={{ display: 'flex', gap: '12px', fontSize: '1.5rem' }}>
        {moods.map((mood) => (
          <button
            key={mood}
            onClick={() => setSelectedMood(mood)}
            style={{
              background: 'none',
              border: 'none',
              opacity: selectedMood === mood ? 1 : 0.5,
              cursor: 'pointer',
            }}
          >
            {mood}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodWidget;