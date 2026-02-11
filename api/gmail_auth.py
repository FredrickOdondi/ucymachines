"""
Gmail OAuth2 authentication and token management.
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from cryptography.fernet import Fernet
import base64

from api.sqlite_store import SQLiteStore

# OAuth scopes
SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly'
]


def get_encryption_key() -> bytes:
    """Get or create encryption key for token storage."""
    key = os.getenv('TOKEN_ENCRYPTION_KEY')
    if key:
        # Use provided key
        return base64.urlsafe_b64encode(key.encode()[:32].ljust(32, b'='))
    else:
        # Generate and warn
        import warnings
        warnings.warn("TOKEN_ENCRYPTION_KEY not set, using insecure storage")
        return Fernet.generate_key()


def encrypt_token(token: str) -> str:
    """Encrypt a token for storage."""
    fernet = Fernet(get_encryption_key())
    return fernet.encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    """Decrypt a stored token."""
    fernet = Fernet(get_encryption_key())
    return fernet.decrypt(encrypted_token.encode()).decode()


def get_auth_url() -> str:
    """
    Generate OAuth consent URL for Gmail authentication.

    Returns:
        URL to redirect user to for OAuth consent
    """
    client_config = {
        "web": {
            "client_id": os.getenv('GMAIL_CLIENT_ID'),
            "client_secret": os.getenv('GMAIL_CLIENT_SECRET'),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [os.getenv('GMAIL_REDIRECT_URI', 'http://localhost:8000/gmail/callback')]
        }
    }

    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = os.getenv('GMAIL_REDIRECT_URI', 'http://localhost:8000/gmail/callback')

    # Generate authorization URL
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )

    return auth_url


def exchange_code_for_tokens(code: str) -> Optional[Dict]:
    """
    Exchange OAuth authorization code for access and refresh tokens.

    Args:
        code: Authorization code from OAuth callback

    Returns:
        Dictionary with gmail_address and credentials info, or None if failed
    """
    try:
        client_config = {
            "web": {
                "client_id": os.getenv('GMAIL_CLIENT_ID'),
                "client_secret": os.getenv('GMAIL_CLIENT_SECRET'),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [os.getenv('GMAIL_REDIRECT_URI', 'http://localhost:8000/gmail/callback')]
            }
        }

        flow = Flow.from_client_config(client_config, scopes=SCOPES)
        flow.redirect_uri = os.getenv('GMAIL_REDIRECT_URI', 'http://localhost:8000/gmail/callback')

        # Exchange code for tokens
        flow.fetch_token(code=code)

        # Get credentials
        credentials = flow.credentials

        # Get email address
        from googleapiclient.discovery import build
        service = build('gmail', 'v1', credentials=credentials)
        profile = service.users().getProfile(userId='me').execute()
        gmail_address = profile['emailAddress']

        # Calculate expiry
        token_expiry = None
        if credentials.expiry:
            token_expiry = credentials.expiry.isoformat()

        # Encrypt and save credentials
        encrypted_access = encrypt_token(credentials.token)
        encrypted_refresh = encrypt_token(credentials.refresh_token) if credentials.refresh_token else None

        SQLiteStore.save_gmail_credentials(
            gmail_address=gmail_address,
            access_token=encrypted_access,
            refresh_token=encrypted_refresh,
            token_expiry=token_expiry
        )

        return {
            "gmail_address": gmail_address,
            "status": "connected"
        }

    except Exception as e:
        print(f"[GmailAuth] Error exchanging code: {e}")
        return None


def get_credentials() -> Optional[Credentials]:
    """
    Retrieve Gmail credentials from database and refresh if needed.

    Returns:
        Google OAuth Credentials object or None if not found
    """
    try:
        stored_creds = SQLiteStore.get_gmail_credentials()
        if not stored_creds:
            return None

        # Decrypt tokens
        access_token = decrypt_token(stored_creds['access_token'])
        refresh_token = decrypt_token(stored_creds['refresh_token']) if stored_creds['refresh_token'] else None

        # Parse expiry
        token_expiry = None
        if stored_creds['token_expiry']:
            try:
                token_expiry = datetime.fromisoformat(stored_creds['token_expiry'])
            except:
                pass

        # Create credentials object
        credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv('GMAIL_CLIENT_ID'),
            client_secret=os.getenv('GMAIL_CLIENT_SECRET'),
            scopes=SCOPES,
            expiry=token_expiry
        )

        # Refresh if expired
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())

            # Save refreshed tokens
            if SQLiteStore.save_gmail_credentials(
                gmail_address=stored_creds['gmail_address'],
                access_token=encrypt_token(credentials.token),
                refresh_token=encrypt_token(credentials.refresh_token),
                token_expiry=credentials.expiry.isoformat() if credentials.expiry else None
            ):
                print("[GmailAuth] Tokens refreshed and saved")

        return credentials

    except Exception as e:
        print(f"[GmailAuth] Error getting credentials: {e}")
        return None


def refresh_access_token() -> bool:
    """
    Force refresh the access token.

    Returns:
        True if successful, False otherwise
    """
    try:
        credentials = get_credentials()
        if not credentials:
            return False

        # Force refresh even if not expired
        if credentials.refresh_token:
            credentials.refresh(Request())

            # Get stored creds to update
            stored_creds = SQLiteStore.get_gmail_credentials()
            if stored_creds:
                SQLiteStore.save_gmail_credentials(
                    gmail_address=stored_creds['gmail_address'],
                    access_token=encrypt_token(credentials.token),
                    refresh_token=encrypt_token(credentials.refresh_token),
                    token_expiry=credentials.expiry.isoformat() if credentials.expiry else None
                )
                return True

        return False
    except Exception as e:
        print(f"[GmailAuth] Error refreshing token: {e}")
        return False


def delete_credentials() -> bool:
    """
    Delete stored Gmail credentials.

    Returns:
        True if successful, False otherwise
    """
    return SQLiteStore.delete_gmail_credentials()
