"""
Email sending API layer for Gmail integration.
"""
from email.message import EmailMessage
import base64
from typing import Optional, Dict
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from api.gmail_auth import get_credentials
from api.sqlite_store import SQLiteStore


def create_email_message(to: str, from_email: str, subject: str, body: str) -> EmailMessage:
    """
    Create a MIME email message.

    Args:
        to: Recipient email address
        from_email: Sender email address
        subject: Email subject
        body: Email body text

    Returns:
        EmailMessage object
    """
    email_msg = EmailMessage()
    email_msg['To'] = to
    email_msg['From'] = from_email
    email_msg['Subject'] = subject
    email_msg.set_content(body)
    return email_msg


def send_via_gmail_api(email_msg: EmailMessage, max_retries: int = 3) -> Optional[Dict]:
    """
    Send email via Gmail API with retry logic.

    Args:
        email_msg: EmailMessage object to send
        max_retries: Maximum number of retry attempts

    Returns:
        Dictionary with message_id and thread_id, or None if failed
    """
    credentials = get_credentials()
    if not credentials:
        raise Exception("Gmail not connected")

    # DEBUG: Print email details
    print(f"[EMAIL SENDER] Sending email:")
    print(f"  To: {email_msg.get('To')}")
    print(f"  From: {email_msg.get('From')}")
    print(f"  Subject: {email_msg.get('Subject')}")
    print(f"  Body preview: {str(email_msg.get_body())[:100]}...")

    # Encode message
    encoded_message = base64.urlsafe_b64encode(email_msg.as_bytes()).decode()
    send_request = {'raw': encoded_message}

    # Send with retries
    for attempt in range(max_retries):
        try:
            service = build('gmail', 'v1', credentials=credentials)
            result = service.users().messages().send(userId='me', body=send_request).execute()

            print(f"[EMAIL SENDER] Gmail API response: {result}")
            return {
                'message_id': result.get('id'),
                'thread_id': result.get('threadId'),
                'label_ids': result.get('labelIds', [])
            }

        except HttpError as e:
            if e.resp.status == 429 and attempt < max_retries - 1:
                # Rate limited, wait and retry
                import time
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            raise Exception(f"Gmail API error: {e}")

        except Exception as e:
            if attempt < max_retries - 1:
                import time
                time.sleep(1)
                continue
            raise Exception(f"Failed to send email: {e}")

    return None


def send_email_to_lead(lead_id: int, content: str) -> Dict:
    """
    Send email to a lead.

    Args:
        lead_id: Lead ID
        content: Email body content

    Returns:
        Dictionary with status and result
    """
    try:
        # Get lead
        lead = SQLiteStore.get_lead(lead_id)
        if not lead:
            return {"success": False, "error": "Lead not found"}

        # Get email from contacts
        contacts = lead.get('contacts', [])
        if not contacts or not contacts[0].get('email'):
            return {"success": False, "error": "Lead has no email address"}

        target_email = contacts[0]['email']
        target_name = contacts[0].get('name', 'there')
        company_name = lead.get('trigger_data', {}).get('company_name', 'your company')

        # Get credentials for sender email
        credentials = get_credentials()
        if not credentials:
            return {"success": False, "error": "Gmail not connected"}

        # Get sender email from stored creds
        stored_creds = SQLiteStore.get_gmail_credentials()
        from_email = stored_creds['gmail_address'] if stored_creds else None

        # Create subject line
        subject = f"Re: {company_name} - Inquiry"

        # Create email message
        email_msg = create_email_message(
            to=target_email,
            from_email=from_email,
            subject=subject,
            body=content
        )

        # Send email
        result = send_via_gmail_api(email_msg)

        if result:
            # Update lead with email tracking
            SQLiteStore.update_lead_email_tracking(
                lead_id=lead_id,
                gmail_message_id=result['message_id'],
                gmail_thread_id=result['thread_id'],
                email_status='sent'
            )

            return {
                "success": True,
                "message_id": result['message_id'],
                "thread_id": result['thread_id'],
                "to": target_email,
                "subject": subject
            }
        else:
            return {"success": False, "error": "Failed to send email"}

    except Exception as e:
        return {"success": False, "error": str(e)}


def send_test_email(to_email: str = None) -> Dict:
    """
    Send a test email to verify Gmail integration.

    Args:
        to_email: Recipient email (defaults to sender's email)

    Returns:
        Dictionary with status and result
    """
    try:
        credentials = get_credentials()
        if not credentials:
            return {"success": False, "error": "Gmail not connected"}

        # Get sender email
        stored_creds = SQLiteStore.get_gmail_credentials()
        from_email = stored_creds['gmail_address'] if stored_creds else None

        # Default to sending to self
        to_email = to_email or from_email

        # Create test email
        from datetime import datetime
        subject = "MachineryLeads - Gmail Integration Test"
        body = f"""This is a test email from MachineryLeads.

Your Gmail integration is working correctly!

Sent at: {datetime.now().isoformat()}

You can safely ignore this email."""

        email_msg = create_email_message(
            to=to_email,
            from_email=from_email,
            subject=subject,
            body=body
        )

        result = send_via_gmail_api(email_msg)

        if result:
            return {
                "success": True,
                "message": "Test email sent successfully",
                "to": to_email,
                "message_id": result['message_id']
            }
        else:
            return {"success": False, "error": "Failed to send test email"}

    except Exception as e:
        return {"success": False, "error": str(e)}


def get_email_status(lead_id: int) -> Dict:
    """
    Get email sending status for a lead.

    Args:
        lead_id: Lead ID

    Returns:
        Dictionary with email status info
    """
    lead = SQLiteStore.get_lead(lead_id)
    if not lead:
        return {"error": "Lead not found"}

    return {
        "lead_id": lead_id,
        "email_status": lead.get('email_status', 'pending'),
        "message_id": lead.get('gmail_message_id'),
        "thread_id": lead.get('gmail_thread_id'),
        "sent_at": lead.get('email_sent_at')
    }
