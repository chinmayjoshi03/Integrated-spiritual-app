const fs = require('fs');
const path = require('path');


const { pool } = require('../db');
const { processScheduledReminders } = require('../services/notifications/reminders');


const INTERVAL_MS = 60 * 1000;

const startedKey = '__spiritualNotificationSchedulerStarted';

const ensureSchema = async () => {
  const possiblePaths = [
    path.join(__dirname, '../database/schema/notifications.sql'),
    path.join(__dirname, '../notifications.sql'),
  ];
  const sqlPath = possiblePaths.find((p) => fs.existsSync(p));
  if (!sqlPath) {
    console.warn('Notifications schema SQL file not found, skipping schema init.');
    return;
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
};

const runTick = async () => {
  try {
    await processScheduledReminders();
  } catch (error) {
    console.error('Notification scheduler error:', error);
  }
};

const startNotificationScheduler = async () => {
  if (globalThis[startedKey]) {
    return;
  }
  globalThis[startedKey] = true;

  try {
    await ensureSchema();
  } catch (error) {
    console.error('Notification schema setup error:', error);
  }

  await runTick();
  const timer = setInterval(runTick, INTERVAL_MS);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
};


module.exports = { startNotificationScheduler };
