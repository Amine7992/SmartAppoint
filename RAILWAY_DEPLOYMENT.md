# Railway Deployment Guide

This repository is an isolated monorepo. Deploy it on Railway as three separate services from the same GitHub repository.

## Services

| Railway service | Root directory | Purpose |
| --- | --- | --- |
| `smartappoint-ai` | `/machine-learning` | Flask AI prediction API |
| `smartappoint-backend` | `/backend` | Express.js REST API |
| `smartappoint-frontend` | `/frontend` | React production build |

Each directory contains a `railway.json` file with its build command, start command, restart policy, and healthcheck.

## Recommended Order

1. Deploy `smartappoint-ai`.
2. Generate its public Railway domain.
3. Deploy `smartappoint-backend` and set `AI_SERVICE_URL` with the AI domain.
4. Generate the backend public Railway domain.
5. Deploy `smartappoint-frontend` and set `REACT_APP_API_URL` with the backend domain.
6. Return to the backend service and set `FRONTEND_URL` and `CORS_ORIGIN` with the frontend domain.
7. Redeploy backend and frontend after changing those variables.

## Backend Variables

Copy from `backend/.env.example` into the backend Railway service variables:

```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-service.up.railway.app
CORS_ORIGIN=https://your-frontend-service.up.railway.app

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_AVATAR_BUCKET=avatars

STRIPE_SECRET_KEY=sk_live_or_test_key
AI_SERVICE_URL=https://your-ai-service.up.railway.app/predict/batch

AUTH_RATE_LIMIT_MAX=40
ADMIN_RATE_LIMIT_MAX=120
```

## Frontend Variables

Copy from `frontend/.env.example` into the frontend Railway service variables:

```env
REACT_APP_API_URL=https://your-backend-service.up.railway.app/api
```

`REACT_APP_API_URL` is baked into the React build. Redeploy the frontend whenever this value changes.

## AI Variables

Copy from `machine-learning/.env.example` into the AI Railway service variables:

```env
PYTHONUNBUFFERED=1
```

Railway injects `PORT` automatically. The Flask service also supports `FLASK_AI_PORT` for local development.

## Healthchecks

- Backend: `/health`
- AI: `/health`
- Frontend: `/`

## Public URLs To Verify

After deployment, verify:

```text
https://your-ai-service.up.railway.app/health
https://your-backend-service.up.railway.app/health
https://your-frontend-service.up.railway.app
```

## Supabase Notes

In Supabase, make sure the deployed frontend URL is allowed wherever your project requires site URLs or redirect URLs. Keep the service role key only in the backend Railway service. Never expose it in the frontend service.
