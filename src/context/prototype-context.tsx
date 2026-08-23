import { createContext, use, useMemo, useState, type PropsWithChildren } from 'react';

type PrototypeContextType = {
  completedTasks: string[];
  bookmarks: string[];
  registeredEvents: string[];
  donations: number[];
  moods: string[];
  courseProgress: number;
  notificationsEnabled: boolean;
  messages: string[];
  toggleTask: (task: string) => void;
  toggleBookmark: (item: string) => void;
  registerEvent: (event: string) => void;
  addDonation: (amount: number) => void;
  addMood: (mood: string) => void;
  advanceCourse: () => void;
  toggleNotifications: () => void;
  sendMessage: (message: string) => void;
};

const PrototypeContext = createContext<PrototypeContextType | null>(null);

export function usePrototype() {
  const context = use(PrototypeContext);
  if (!context) throw new Error('usePrototype must be used within PrototypeProvider');
  return context;
}

export function PrototypeProvider({ children }: PropsWithChildren) {
  const [completedTasks, setCompletedTasks] = useState(['Morning prayer', 'Reading']);
  const [bookmarks, setBookmarks] = useState<string[]>(['Stillness within']);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [donations, setDonations] = useState<number[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [courseProgress, setCourseProgress] = useState(38);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [messages, setMessages] = useState<string[]>(['Namaste. How may I support your practice today?']);

  const value = useMemo(() => ({
    completedTasks, bookmarks, registeredEvents, donations, moods, courseProgress, notificationsEnabled, messages,
    toggleTask: (task: string) => setCompletedTasks((items) => items.includes(task) ? items.filter((item) => item !== task) : [...items, task]),
    toggleBookmark: (item: string) => setBookmarks((items) => items.includes(item) ? items.filter((saved) => saved !== item) : [...items, item]),
    registerEvent: (event: string) => setRegisteredEvents((items) => items.includes(event) ? items : [...items, event]),
    addDonation: (amount: number) => setDonations((items) => [...items, amount]),
    addMood: (mood: string) => setMoods((items) => [mood, ...items]),
    advanceCourse: () => setCourseProgress((progress) => Math.min(100, progress + 12)),
    toggleNotifications: () => setNotificationsEnabled((enabled) => !enabled),
    sendMessage: (message: string) => setMessages((items) => [...items, message, 'Take one slow breath. What feels most present for you now?']),
  }), [bookmarks, completedTasks, courseProgress, donations, messages, moods, notificationsEnabled, registeredEvents]);

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}
