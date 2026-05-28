# Deployment Guide

## Frontend on Vercel

1. Import the repository into Vercel.
2. Set root directory to `buildboard-frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

## Backend on Render

1. Create a Web Service.
2. Set root directory to `buildboard-backend`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add environment variables:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=<long-random-secret>
JWT_REFRESH_SECRET=<another-long-random-secret>
CLIENT_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```

## Backend on Vercel (serverless)

1. Import the repository into Vercel.
2. Set root directory to `buildboard-backend`.
3. Framework preset: Other.
4. Ensure `vercel.json` is included (routes all traffic to `index.js`).
5. Add environment variables:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=<long-random-secret>
JWT_REFRESH_SECRET=<another-long-random-secret>
CLIENT_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

Note: Socket.io features require a long-lived server and are not supported on Vercel serverless.

## MongoDB Atlas

1. Create an Atlas cluster.
2. Create a database user.
3. Allow Render outbound access using Atlas network rules.
4. Copy the connection string to `MONGODB_URI`.

## Cloudinary Storage

The current upload system stores local files. For production, add Cloudinary credentials and replace local upload persistence in `uploadMiddleware.js` with Cloudinary upload calls while keeping model fields such as `path`, `mimeType`, and `size`.

## CI/CD

Recommended GitHub Actions pipeline:

```yaml
name: BuildBoard CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: buildboard-frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: buildboard-backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: node --check server.js
```
