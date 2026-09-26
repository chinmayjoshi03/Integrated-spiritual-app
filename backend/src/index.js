require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const tasksRoutes = require('./routes/tasks');
const meditationsRoutes = require('./routes/meditations');
const communityRoutes = require('./routes/community');
const eventsRoutes = require('./routes/events');
const volunteerRoutes = require('./routes/volunteer');
const shopRoutes = require('./routes/shop');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Directories ────────────────────────────────────────────────────────────────
const VIDEOS_DIR = path.join(__dirname, '..', 'videos');
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

const RESOURCES_DIR = path.join(__dirname, '..', 'resources');
if (!fs.existsSync(RESOURCES_DIR)) fs.mkdirSync(RESOURCES_DIR, { recursive: true });

const AUDIO_DIR = path.join(__dirname, '..', 'audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());

// ── Video streaming ────────────────────────────────────────────────────────────
/**
 * GET /api/video/:filename
 * Streams a local .mp4 file from backend/videos/ with proper range-request
 * support so React Native's video player can seek.
 *
 * Drop any .mp4 into backend/videos/ and store the filename in lessons.video_filename.
 * When you migrate to Cloudflare Stream / Mux, just change the URL generation
 * in the frontend — this endpoint is dev-only.
 */
app.get('/api/video/:filename', authenticate, (req, res) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(VIDEOS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video file not found.' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Honour Range requests so the player can seek
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// ── Audio streaming ────────────────────────────────────────────────────────────
/**
 * GET /api/audio/:filename
 * Streams local audio (.mp3, .wav, .m4a, .aac) from backend/audio/ with byte-range headers
 * so React Native / web audio player can seek.
 */
app.get('/api/audio/:filename', authenticate, (req, res) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(AUDIO_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found.' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
  };
  const contentType = mimeTypes[ext] || 'audio/mpeg';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// ── Resource / PDF Access ──────────────────────────────────────────────────────
/**
 * GET /api/resource/:filename
 * Serves local PDFs or documents from backend/resources/
 *
 * Drop any .pdf or document into backend/resources/ and store the filename in resources.file_url.
 */
app.get('/api/resource/:filename', authenticate, (req, res) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(RESOURCES_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Resource file not found.' });
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  fs.createReadStream(filePath).pipe(res);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/meditations', meditationsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/shop', shopRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Auth API:        http://localhost:${PORT}/api/auth`);
  console.log(`🎬 Video API:      http://localhost:${PORT}/api/video/:filename`);
  console.log(`🎧 Audio API:      http://localhost:${PORT}/api/audio/:filename`);
  console.log(`📄 Resource API:   http://localhost:${PORT}/api/resource/:filename`);
  console.log(`📁 Videos dir:     ${VIDEOS_DIR}`);
  console.log(`📁 Audio dir:      ${AUDIO_DIR}`);
  console.log(`📁 Resources dir:  ${RESOURCES_DIR}`);
});
