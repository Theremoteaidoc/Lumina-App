# Lumina API — Backend Serverless Functions

This folder contains Vercel Serverless Functions that power Lumina's backend.
Each file is an API route: `api/analyze-face.js` becomes `POST /api/analyze-face`.

In local development the Vite dev server intercepts `/api/*` requests and runs
the same handler code, so you never need the Vercel CLI to develop locally.

---

## Setup: Anthropic API Key

### 1. Get your API key

Go to: https://console.anthropic.com/settings/keys

- Sign in (or create a free account).
- Click "Create Key".
- Copy the key — it starts with `sk-ant-api03-...`.
- Store it somewhere safe; you cannot see it again after closing that screen.

### 2. Create your local env file

In the `lumina-app/` folder:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and replace the placeholder with your real key:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-real-key-here
```

`.env.local` is listed in `.gitignore` — it will never be committed.

### 3. Start the dev server

```bash
npm run dev
```

The Vite server starts at http://localhost:5173. API routes are available at
http://localhost:5173/api/*.

---

## Testing the endpoint

### Without API key (verifies the error path works)

```bash
curl -X POST http://127.0.0.1:5173/api/analyze-face \
  -H "Content-Type: application/json" \
  -d '{"image":"aGVsbG8gd29ybGQ=","mimeType":"image/jpeg"}'
```

Expected response (500):
```json
{
  "ok": false,
  "error": "Configura ANTHROPIC_API_KEY en .env.local. Lee .env.local.example para instrucciones."
}
```

### With API key and a real image

Convert an image to base64 (remove the `data:image/jpeg;base64,` prefix):

```bash
# On Linux/macOS:
BASE64=$(base64 -w 0 photo.jpg)

# Then call:
curl -X POST http://127.0.0.1:5173/api/analyze-face \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"$BASE64\",\"mimeType\":\"image/jpeg\",\"profile\":{\"name\":\"Valery\",\"ageRange\":\"13-15\"}}"
```

---

## Deploying to Vercel

1. Push your code to GitHub (`.env.local` is gitignored — it stays local).
2. Import the repo in Vercel: https://vercel.com/new
3. Set the root directory to `lumina-app/`.
4. Add the environment variable in Vercel dashboard:
   - Project Settings > Environment Variables
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key
   - Environment: Production (and Preview if you want)
5. Deploy. Vercel automatically treats `api/*.js` files as serverless functions.

---

## Cost estimates

All costs are for `claude-sonnet-4-6` with prompt caching active.

| Scenario | Input tokens | Output tokens | Cost per analysis |
|---|---|---|---|
| First call (cache MISS — system prompt billed fully) | ~4,500 | ~400 | ~$0.020 |
| Subsequent calls (cache HIT — system prompt at 10%) | ~450 billed + 4,050 cached | ~400 | ~$0.006 |

Pricing basis (Anthropic, June 2026):
- Input: $3.00 / 1M tokens
- Cache write: $3.75 / 1M tokens
- Cache read: $0.30 / 1M tokens
- Output: $15.00 / 1M tokens

Monthly cost at scale (assuming 50% cache hit rate on system prompt):

| Users | Analyses/month | Est. monthly cost |
|---|---|---|
| 0 | 0 | $0 |
| 100 | ~300 | ~$3–5 |
| 1,000 | ~3,000 | ~$25–40 |

For lower cost: change the model to `claude-haiku-4-5` (~$0.002/analysis).
For maximum precision: change to `claude-opus-4-7` (~$0.08/analysis).

---

## Changing the model

In `api/analyze-face.js`, line with `model: 'claude-sonnet-4-6'`:

```js
// More affordable (lower quality):
model: 'claude-haiku-4-5',

// Current default (recommended):
model: 'claude-sonnet-4-6',

// Highest quality (higher cost):
model: 'claude-opus-4-7',
```

---

## Privacy

- The image is held in memory only during the API call. It is never written to
  disk, never logged, and never stored in any database.
- Only the classification result (e.g., "ovalado") and token counts are logged
  to the server console.
- The user profile fields `name` and PII are sent to Claude for context but are
  not logged by this server.
- Before launching publicly: coordinate with the security agent to confirm this
  meets COPPA requirements for users under 13.
