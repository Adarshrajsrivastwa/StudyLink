# Environment Variables

This document describes all environment variables used in the frontend application.

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` according to your environment.

## Variables

### `VITE_API_URL`
- **Description**: Base URL for the backend API
- **Default**: `http://localhost:5000/api`
- **Example**: `http://localhost:5000/api` or `https://api.example.com/api`
- **Usage**: Used for all API calls to the backend

### `VITE_SOCKET_URL`
- **Description**: WebSocket server URL for real-time features (Socket.IO)
- **Default**: `http://localhost:5000`
- **Example**: `http://localhost:5000` or `https://socket.example.com`
- **Usage**: Used for real-time chat and notifications

### `VITE_APP_NAME`
- **Description**: Application name
- **Default**: `Vivid Vision`
- **Usage**: Can be used for branding or display purposes

### `VITE_APP_ENV`
- **Description**: Environment mode (development, production, staging)
- **Default**: `development`
- **Usage**: Used to determine build configuration and behavior

## Important Notes

- All Vite environment variables must be prefixed with `VITE_` to be accessible in the frontend code
- Environment variables are embedded at build time, not runtime
- After changing `.env` file, you need to restart the development server
- Never commit `.env` file to version control (it's already in `.gitignore`)
- Always commit `.env.example` as a template for other developers

## Production

For production builds, set the appropriate values in your deployment environment or CI/CD pipeline:

```bash
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://socket.yourdomain.com
VITE_APP_ENV=production
```

