# Fix: Community API 400 Error

## Problem
You're getting:
```
POST http://localhost:3001/api/community/posts/3/comments 400 (Bad Request)
```

## Root cause
The community feature tables (`posts`, `post_likes`, `post_comments`) don't exist in your database yet. They were added to `init-db.js` but you haven't run the script since the new tables were added.

## Solution

### Step 1: Stop the backend
Press `Ctrl+C` in the terminal running `node src/index.js`

### Step 2: Re-run the database init script
```bash
cd backend
node src/scripts/init-db.js
```

This will create all missing tables:
- ✅ `posts`
- ✅ `post_likes`
- ✅ `post_comments`
- ✅ `daily_tasks` (for Home screen task checklist)
- ✅ All 9 courses/LMS tables

### Step 3: Restart the backend
```bash
node src/index.js
```

### Step 4: Test in the app
1. Navigate to **Connect tab** → Community circle
2. Tap a post to open the detail screen
3. Type a comment and tap "Post comment"

It should now work without the 400 error.

---

## What the init script does
- Creates all tables using `CREATE TABLE IF NOT EXISTS` (safe to run multiple times)
- Seeds sample data for courses, lessons, quizzes, and community posts
- Adds indexes for performance

## If you still see 400 errors after this
Check the backend terminal output — it will show the actual error:
```
POST /api/community/posts/:id/comments error: <actual error message>
```

Common causes:
- Empty comment content (validation on line 148 of community.js)
- Missing authentication token
- Network mismatch (check `LOCAL_IP` in `src/services/api.ts`)
