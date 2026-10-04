import { Home, Calendar, Users, MessageSquare, BookOpen, StickyNote, BarChart3, MessagesSquare, Megaphone, Settings } from 'lucide-react';

export const mentorNavSections = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: Home, path: '/mentor' },
      { label: 'My Sessions', icon: Calendar, path: '/mentor/sessions' },
      { label: 'My Students', icon: Users, path: '/mentor/students' },
      { label: 'Messages', icon: MessageSquare, path: '/mentor/messages' },
      { label: 'Resources', icon: StickyNote, path: '/mentor/upload-meditation' },
    ],
  },
  {
    title: 'TEACHING',
    items: [
      { label: 'My Courses', icon: BookOpen, path: '/mentor/my-courses' },
      { label: 'Resources', icon: StickyNote, path: '/mentor/resources' },
      { label: 'Student Progress', icon: BarChart3, path: '/mentor/progress' },
    ],
  },
  {
    title: 'COMMUNITY',
    items: [
      { label: 'Community', icon: MessagesSquare, path: '/mentor/community' },
      { label: 'Announcements', icon: Megaphone, path: '/mentor/announcements' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [{ label: 'Settings', icon: Settings, path: '/mentor/settings' }],
  },
];