# Google OAuth Setup Guide for MachineryLeads Platform

This guide explains how to set up Google OAuth login for the MachineryLeads platform.

## Overview

The platform uses Google OAuth 2.0 for user authentication. Users sign in with their Google account, and the platform uses JWT tokens for session management.

## Prerequisites

- Google Cloud Console account
- Project running on http://localhost:5173 (frontend) and http://127.0.0.1:8000 (backend)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: "MachineryLeads Platform"
5. Click "Create"

## Step 2: Enable Required APIs

1. In the left sidebar, go to "APIs & Services" > "Library"
2. Search for and enable:
   - **Google+ API** (for user profile info)
3. Wait for each API to be enabled

## Step 3: Create OAuth 2.0 Client ID

1. Go to "APIs & Services" > "Credentials" in the left sidebar
2. Click "+ Create Credentials" at the top
3. Select "OAuth client ID"
4. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Enter app name: "MachineryLeads Platform"
   - Add your email as developer contact
   - Skip the app details (optional)
   - Skip the scopes (not needed for login)
   - Add test users (add your email for testing)
   - Click "Save and Continue"
5. Back in OAuth client ID creation:
   - Application type: **Web application**
   - Name: "MachineryLeads Web Client"
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/callback`
     - `http://127.0.0.1:3000/auth/callback` (alternative)
     - (For production) `https://your-domain.com/auth/callback`
   - Click "Create"
6. **Important**: Copy the **Client ID** and **Client Secret**

## Step 4: Configure Environment Variables

Add the following to your `.env` file:

```bash
# Platform Login - Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret-here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback

# JWT Secret for session tokens
# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET=your-random-jwt-secret-here
```

## Step 5: Install Dependencies

### Backend
```bash
pip install python-jose[cryptography]
```

Or reinstall all requirements:
```bash
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

This will install react-router-dom and phosphor-react.

## Step 6: Restart Services

1. Restart the backend server:
```bash
python3 -m uvicorn api.server:app --reload --host 127.0.0.1 --port 8000
```

2. Restart the frontend:
```bash
cd frontend
npm run dev
```

## Step 7: Test Login Flow

1. Navigate to `http://localhost:5173`
2. You should be redirected to the login page
3. Click "Continue with Google"
4. Sign in with your Google account
5. Approve the permissions (if prompted)
6. You should be redirected back to the platform, now authenticated

## Security Notes

- JWT_SECRET should be unique and kept confidential
- Use environment variables, never commit secrets to git
- Tokens expire after 24 hours
- Always validate tokens on the server side
- Use HTTPS in production for secure token transmission
