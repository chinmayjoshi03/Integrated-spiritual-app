import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Guards
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';
import NotFoundPage from '../pages/NotFoundPage';
import ComingSoonPage from '../components/ComingSoonPage/ComingSoonPage';

// Auth Pages (no /pages/ subfolder)
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import VerifyEmailPage from '../features/auth/VerifyEmailPage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/ResetPasswordPage';

// Dashboard Pages
import DashboardPage from '../features/dashboard/DashboardPage';
import ProfilePage from '../features/dashboard/ProfilePage';
import AdminDashboardPage from '../features/dashboard/admin/AdminDashboardPage';
import MentorDashboardPage from '../features/dashboard/mentor/MentorDashboardPage';

// Nav configs for ComingSoon fallback
import { userNavSections } from '../features/dashboard/userNavConfig';
import { adminNavSections } from '../features/dashboard/admin/adminNavConfig';
import { mentorNavSections } from '../features/dashboard/mentor/mentorNavConfig';

// Meditation
import MeditationListPage from '../features/meditation/MeditationListPage';
import MeditationPlayerPage from '../features/meditation/MeditationPlayerPage';
import UploadMeditationPage from '../features/dashboard/mentor/UploadMeditationPage';
import AdminUploadMeditationPage from '../features/dashboard/admin/UploadMeditationPage';

// Courses
import CourseListPage from '../features/courses/CourseListPage';
import CourseDetailPage from '../features/courses/CourseDetailPage';
import ManageCoursesPage from '../features/dashboard/admin/ManageCoursesPage';
import CreateCoursePage from '../features/dashboard/admin/CreateCoursePage';
import MyCoursesPage from '../features/dashboard/mentor/MyCoursesPage';
import ManageLessonsPage from '../features/dashboard/mentor/ManageLessonsPage';

// Shop
import ShopPage from '../features/shop/ShopPage';
import CartPage from '../features/shop/CartPage';
import OrderHistoryPage from '../features/shop/OrderHistoryPage';
import ProductDetailPage from '../features/shop/ProductDetailPage';
import ManageProductsPage from '../features/dashboard/admin/ManageProductsPage';
import CreateProductPage from '../features/dashboard/admin/CreateProductPage';

// Events
import EventsPage from '../features/events/pages/EventsPage';
import EventDetailsPage from '../features/events/pages/EventDetailsPage';
import MyEventsPage from '../features/events/pages/MyEventsPage';
import AdminEventsPage from '../features/events/pages/AdminEventsPage';
import AdminCreateEventPage from '../features/events/pages/AdminCreateEventPage';
import AdminEditEventPage from '../features/events/pages/AdminEditEventPage';
import AdminEventManagePage from '../features/events/pages/AdminEventManagePage';

// Volunteering
import VolunteeringPage from '../features/volunteering/pages/VolunteeringPage';
import VolunteerOpportunityPage from '../features/volunteering/pages/VolunteerOpportunityPage';
import MyVolunteeringPage from '../features/volunteering/pages/MyVolunteeringPage';
import AdminVolunteeringPage from '../features/volunteering/pages/AdminVolunteeringPage';
import AdminCreateVolunteerPage from '../features/volunteering/pages/AdminCreateVolunteerPage';
import AdminVolunteerManagePage from '../features/volunteering/pages/AdminVolunteerManagePage';

// Community
import CommunityPage from '../features/community/pages/CommunityPage';
import CommunityGroupPage from '../features/community/pages/CommunityGroupPage';
import CommunityQuestionPage from '../features/community/pages/CommunityQuestionPage';
import AdminCommunityPage from '../features/community/pages/AdminCommunityPage';

// Notifications
import NotificationsPage from '../features/notifications/pages/NotificationsPage';
import NotificationSettingsPage from '../features/notifications/pages/NotificationSettingsPage';
import AdminNotificationsPage from '../features/notifications/pages/AdminNotificationsPage';

// Help & Support
import HelpPage from '../features/help/pages/HelpPage';
import MySupportPage from '../features/help/pages/MySupportPage';
import CreateSupportPage from '../features/help/pages/CreateSupportPage';
import SupportTicketPage from '../features/help/pages/SupportTicketPage';
import AdminHelpDeskPage from '../features/help/pages/AdminHelpDeskPage';
import AdminTicketPage from '../features/help/pages/AdminTicketPage';
import AdminFaqsPage from '../features/help/pages/AdminFaqsPage';
import AdminFaqFormPage from '../features/help/pages/AdminFaqFormPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Website Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/volunteering" element={<VolunteeringPage />} />
        <Route path="/volunteering/:id" element={<VolunteerOpportunityPage />} />
        <Route path="/courses" element={<Navigate to="/dashboard/courses" replace />} />
        <Route path="/courses/:id" element={<Navigate to="/dashboard/courses" replace />} />
        <Route path="/meditation" element={<Navigate to="/dashboard/meditation" replace />} />
        <Route path="/shop" element={<Navigate to="/dashboard/shop" replace />} />
        <Route path="/cart" element={<Navigate to="/dashboard/cart" replace />} />
        <Route path="/orders" element={<Navigate to="/dashboard/orders" replace />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<AuthLayout />}>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* User Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />

        {/* Meditation */}
        <Route path="/dashboard/meditation" element={<MeditationListPage />} />
        <Route path="/dashboard/meditation/:id" element={<MeditationPlayerPage />} />

        {/* Courses */}
        <Route path="/dashboard/courses" element={<CourseListPage />} />
        <Route path="/dashboard/courses/:id" element={<CourseDetailPage />} />

        {/* Shop */}
        <Route path="/dashboard/shop" element={<ShopPage />} />
        <Route path="/dashboard/cart" element={<CartPage />} />
        <Route path="/dashboard/orders" element={<OrderHistoryPage />} />
        <Route path="/dashboard/shop/:id" element={<ProductDetailPage />} />

        {/* Events */}
        <Route path="/my-events" element={<MyEventsPage />} />
        <Route path="/dashboard/events" element={<EventsPage />} />
        <Route path="/dashboard/my-events" element={<MyEventsPage />} />

        {/* Volunteering */}
        <Route path="/my-volunteering" element={<MyVolunteeringPage />} />
        <Route path="/dashboard/volunteer" element={<VolunteeringPage />} />
        <Route path="/dashboard/volunteering" element={<VolunteeringPage />} />
        <Route path="/dashboard/my-volunteering" element={<MyVolunteeringPage />} />

        {/* Community */}
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/groups/:id" element={<CommunityGroupPage />} />
        <Route path="/community/questions/:id" element={<CommunityQuestionPage />} />
        <Route path="/dashboard/community" element={<CommunityPage />} />
        <Route path="/dashboard/community/groups/:id" element={<CommunityGroupPage />} />
        <Route path="/dashboard/community/questions/:id" element={<CommunityQuestionPage />} />

        {/* Notifications */}
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
        <Route path="/dashboard/notifications" element={<NotificationsPage />} />

        {/* Support & Tickets */}
        <Route path="/my-support" element={<MySupportPage />} />
        <Route path="/my-support/new" element={<CreateSupportPage />} />
        <Route path="/my-support/:id" element={<SupportTicketPage />} />
        <Route path="/dashboard/help" element={<HelpPage />} />
        <Route path="/dashboard/support" element={<MySupportPage />} />
        <Route path="/dashboard/support/new" element={<CreateSupportPage />} />
        <Route path="/dashboard/support/:id" element={<SupportTicketPage />} />

        {/* Fallback for unbuilt user sections */}
        <Route
          path="/dashboard/*"
          element={
            <ComingSoonPage
              portalLabel="MY SPACE"
              sections={userNavSections}
              homePath="/dashboard"
              title="Coming Soon"
            />
          }
        />
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />

        {/* Admin Events */}
        <Route path="/admin/events" element={<AdminEventsPage />} />
        <Route path="/admin/events/create" element={<AdminCreateEventPage />} />
        <Route path="/admin/events/:id/edit" element={<AdminEditEventPage />} />
        <Route path="/admin/events/:id" element={<AdminEventManagePage />} />

        {/* Admin Courses */}
        <Route path="/admin/courses" element={<ManageCoursesPage />} />
        <Route path="/admin/courses/create" element={<CreateCoursePage />} />

        {/* Admin Shop */}
        <Route path="/admin/shop" element={<ManageProductsPage />} />
        <Route path="/admin/shop/create" element={<CreateProductPage />} />

        {/* Admin Meditation */}
        <Route path="/admin/meditation/upload" element={<AdminUploadMeditationPage />} />

        {/* Admin Community */}
        <Route path="/admin/community" element={<AdminCommunityPage />} />

        {/* Admin Volunteering */}
        <Route path="/admin/volunteering" element={<AdminVolunteeringPage />} />
        <Route path="/admin/volunteering/create" element={<AdminCreateVolunteerPage />} />
        <Route path="/admin/volunteering/:id" element={<AdminVolunteerManagePage />} />

        {/* Admin Notifications */}
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />

        {/* Admin Helpdesk */}
        <Route path="/admin/helpdesk" element={<AdminHelpDeskPage />} />
        <Route path="/admin/support" element={<AdminHelpDeskPage />} />
        <Route path="/admin/helpdesk/tickets/:id" element={<AdminTicketPage />} />
        <Route path="/admin/support/tickets/:id" element={<AdminTicketPage />} />
        <Route path="/admin/helpdesk/faqs" element={<AdminFaqsPage />} />
        <Route path="/admin/helpdesk/faqs/create" element={<AdminFaqFormPage />} />
        <Route path="/admin/helpdesk/faqs/:id/edit" element={<AdminFaqFormPage />} />

        {/* Fallback for unbuilt admin sections */}
        <Route
          path="/admin/*"
          element={
            <ComingSoonPage
              portalLabel="ADMIN PORTAL"
              sections={adminNavSections}
              homePath="/admin"
              title="Coming Soon"
            />
          }
        />
      </Route>

      {/* Mentor Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['mentor']} />}>
        <Route path="/mentor" element={<MentorDashboardPage />} />
        <Route path="/mentor/upload-meditation" element={<UploadMeditationPage />} />
        <Route path="/mentor/my-courses" element={<MyCoursesPage />} />
        <Route path="/mentor/courses/:courseId/manage" element={<ManageLessonsPage />} />
        <Route path="/mentor/community" element={<CommunityPage />} />

        {/* Fallback for unbuilt mentor sections */}
        <Route
          path="/mentor/*"
          element={
            <ComingSoonPage
              portalLabel="MENTOR PORTAL"
              sections={mentorNavSections}
              homePath="/mentor"
              title="Coming Soon"
            />
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;