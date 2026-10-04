import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import meditationRoutes from './routes/meditationRoutes.js';
import eventsRoutes from './routes/eventsRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import helpRoutes from './routes/helpRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import { startNotificationScheduler } from './jobs/notificationScheduler.js';
import { ensureHelpSchema } from './services/help/ensureSchema.js';
import { ensureIntegratedSchema } from './database/ensureIntegratedSchema.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('Spiritual Platform API is running.');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Existing routes
app.use('/api/auth', authRoutes);
app.use('/api/meditation', meditationRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/volunteering', volunteerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/support', supportRoutes);

// Integrated routes from spiritual-platform-backend
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startNotificationScheduler().catch((error) => {
    console.error('Notification scheduler startup error:', error);
  });
  ensureHelpSchema().catch((error) => {
    console.error('Help schema setup error:', error);
  });
  ensureIntegratedSchema().catch((error) => {
    console.error('Integrated schema setup error:', error);
  });
});
