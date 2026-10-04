# LogSentinel Dashboard Frontend

React + Vite frontend for the LogSentinel operations dashboard.

## Local development

```bash
npm ci
npm run dev
```

## Build

```bash
npm run build
```

## Deploy on Vercel

The frontend directory includes `vercel.json`. Set the Vercel project's Root
Directory to `services/dashboard-frontend` when importing the GitHub repo.

Use these settings if Vercel asks for them:

- Framework Preset: `Vite`
- Root Directory: `services/dashboard-frontend`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`

The root `.vercelignore` uploads only this frontend and the Vercel config.
