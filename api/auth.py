"""
Google OAuth authentication for the MachineryLeads platform.
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from fastapi import HTTPException
from jose import JWTError, jwt
from pydantic import BaseModel
import secrets

# JWT Secret for session tokens
JWT_SECRET = os.getenv('JWT_SECRET', secrets.token_urlsafe(32))
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# OAuth scopes for login (just need email/profile)
OAUTH_SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
]


class OAuthConfig:
    """Google OAuth configuration."""
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_OAUTH_REDIRECT_URI', 'http://localhost:5173/auth/callback')

    def get_flow(self):
        """Create OAuth flow instance."""
        config = {
            "web": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [self.redirect_uri]
            }
        }
        flow = Flow.from_client_config(config, scopes=OAUTH_SCOPES)
        flow.redirect_uri = self.redirect_uri
        return flow


def get_auth_url() -> str:
    """Generate Google OAuth authorization URL."""
    try:
        oauth_config = OAuthConfig()
        print(f"[Auth] Client ID: {oauth_config.client_id[:20]}...")
        print(f"[Auth] Redirect URI: {oauth_config.redirect_uri}")

        flow = oauth_config.get_flow()

        # Generate state parameter for security
        state = secrets.token_urlsafe(16)

        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=state
        )

        print(f"[Auth] Generated auth URL: {auth_url[:100]}...")
        return auth_url
    except Exception as e:
        print(f"[Auth] Error generating auth URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate auth URL")


def exchange_code_for_token(code: str) -> dict:
    """Exchange OAuth code for user info and create JWT token."""
    try:
        print("[Auth] Received OAuth callback, exchanging code for token...")
        oauth_config = OAuthConfig()
        flow = oauth_config.get_flow()

        # Exchange code for token
        flow.fetch_token(code=code)
        print("[Auth] Successfully exchanged code for token")

        # Get credentials
        credentials = flow.credentials

        # Get user info from Google
        import requests
        response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {credentials.token}'}
        )
        user_info = response.json()
        print(f"[Auth] Got user info: {user_info.get('email')}")

        # Create JWT token
        token_data = {
            'sub': user_info.get('id'),
            'email': user_info.get('email'),
            'name': user_info.get('name'),
            'picture': user_info.get('picture'),
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }

        jwt_token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        print(f"[Auth] Generated JWT token for {user_info.get('email')}")

        return {
            'token': jwt_token,
            'user': {
                'email': user_info.get('email'),
                'name': user_info.get('name'),
                'picture': user_info.get('picture')
            }
        }

    except Exception as e:
        print(f"[Auth] Error exchanging code: {e}")
        raise HTTPException(status_code=401, detail="Failed to authenticate")


def verify_token(token: str) -> dict:
    """Verify JWT token and return user info."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {
            'email': payload.get('email'),
            'name': payload.get('name'),
            'picture': payload.get('picture')
        }
    except JWTError as e:
        print(f"[Auth] Invalid token: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
