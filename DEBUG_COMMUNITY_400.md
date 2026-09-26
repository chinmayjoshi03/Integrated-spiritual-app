# Debug Community 400 Error

I've added debug logging to see exactly what the backend is receiving.

## Steps to debug:

### 1. Restart the backend
```bash
# Stop the current backend (Ctrl+C)
cd backend
node src/index.js
```

### 2. Try posting a comment in the app
Go to: **Connect tab** → Community circle → tap any post → write a comment → tap "Post comment"

### 3. Check the backend terminal output
You should see one of these logs:

**If the request reaches the backend:**
```
📝 POST comment request: { postId: 3, body: {...}, content: '...', contentType: 'application/json' }
```

**If validation fails:**
```
❌ Validation failed: content empty
```

### 4. Share the exact output with me

The log will show:
- What `postId` was sent
- The full `req.body` object
- The extracted `content` value
- The `Content-Type` header

This will tell us if:
- ❌ The request body is empty (body: {})
- ❌ The content field is missing
- ❌ The content is an empty string
- ❌ The Content-Type header is wrong

---

## Most likely causes:

### Cause 1: Request body is undefined/empty
**Symptom:** Log shows `body: {}`

**Fix:** The `express.json()` middleware might not be processing the body. Check that it's registered BEFORE the routes in `backend/src/index.js`:
```javascript
app.use(cors());
app.use(express.json());  // ← Must be before routes

app.use('/api/community', communityRoutes);
```

### Cause 2: Content field is missing
**Symptom:** Log shows `body: { someOtherField: '...' }` but no `content`

**Fix:** The frontend is sending the wrong field name. Check the API call in the frontend.

### Cause 3: Content-Type header is missing
**Symptom:** Log shows `contentType: undefined`

**Fix:** The fetch request isn't setting the header. But this shouldn't happen since `api.ts` sets it by default.

---

## Try this curl test first:

```bash
# Replace YOUR_TOKEN with a real JWT from the app
curl -X POST http://localhost:3001/api/community/posts/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content":"Test comment from curl"}' \
  -v
```

If curl works but the app doesn't, it's a frontend issue.
If curl also fails with 400, it's a backend issue.
