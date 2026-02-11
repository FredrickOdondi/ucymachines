"""
Gmail email synchronization for receiving replies.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from api.gmail_auth import get_credentials
from api.sqlite_store import SQLiteStore


def get_last_sync_time() -> Optional[datetime]:
    """Get the last sync time from a simple file storage."""
    import os
    from pathlib import Path

    sync_file = Path(__file__).parent.parent / ".last_gmail_sync"
    if sync_file.exists():
        try:
            with open(sync_file, 'r') as f:
                timestamp_str = f.read().strip()
                return datetime.fromisoformat(timestamp_str)
        except:
            pass
    # Default to 1 day ago if no sync file
    return datetime.now() - timedelta(days=1)


def update_last_sync_time(sync_time: datetime = None) -> bool:
    """Update the last sync time in file storage."""
    try:
        import os
        from pathlib import Path

        sync_file = Path(__file__).parent.parent / ".last_gmail_sync"
        sync_time = sync_time or datetime.now()

        with open(sync_file, 'w') as f:
            f.write(sync_time.isoformat())

        return True
    except Exception as e:
        print(f"[GmailSync] Error updating sync time: {e}")
        return False


def fetch_new_messages(since: datetime = None) -> List[Dict]:
    """
    Fetch new messages from Gmail since the last sync.

    Args:
        since: DateTime to fetch messages from

    Returns:
        List of message dictionaries
    """
    try:
        credentials = get_credentials()
        if not credentials:
            print("[GmailSync] Gmail not connected")
            return []

        service = build('gmail', 'v1', credentials=credentials)

        # Build search query for messages after the sync time
        since = since or get_last_sync_time()
        query = f"after:{since.strftime('%Y/%m/%d')}"

        # List messages
        results = service.users().messages().list(
            userId='me',
            q=query,
            labelIds=['INBOX']
        ).execute()

        messages = results.get('messages', [])
        new_messages = []

        # Fetch full message details
        for msg_ref in messages[:50]:  # Limit to 50 messages per sync
            try:
                msg = service.users().messages().get(
                    userId='me',
                    id=msg_ref['id'],
                    format='metadata',
                    metadataHeaders=['From', 'To', 'Subject', 'Date']
                ).execute()

                new_messages.append(msg)

            except HttpError as e:
                print(f"[GmailSync] Error fetching message {msg_ref['id']}: {e}")
                continue

        return new_messages

    except Exception as e:
        print(f"[GmailSync] Error fetching messages: {e}")
        return []


def extract_email_address(header_value: str) -> str:
    """
    Extract email address from header value (may include name).

    Args:
        header_value: Header value like "John Doe <john@example.com>"

    Returns:
        Email address only
    """
    import re
    match = re.search(r'<([^>]+)>', header_value)
    if match:
        return match.group(1)
    # Return as-is if no angle brackets
    return header_value.strip()


def match_to_lead(sender_email: str, subject: str, thread_id: str = None) -> Optional[int]:
    """
    Match an incoming email to a lead in the database.

    Args:
        sender_email: Sender's email address
        subject: Email subject
        thread_id: Gmail thread ID (most reliable)

    Returns:
        Lead ID if matched, None otherwise
    """
    try:
        leads = SQLiteStore.get_leads(limit=1000)

        for lead in leads:
            # METHOD 1: Match by thread_id (most reliable)
            if thread_id and lead.get('gmail_thread_id') == thread_id:
                print(f"[GmailSync] Matched by thread_id {thread_id} to lead {lead['id']}")
                return lead['id']

            # METHOD 2: Check if sender email matches any contact email (with fuzzy matching)
            contacts = lead.get('contacts', [])
            for contact in contacts:
                contact_email = contact.get('email', '')
                if contact_email:
                    # Extract valid email from broken text like "email@domain.comExtra text"
                    import re
                    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', contact_email)
                    if email_match:
                        actual_email = email_match.group(0)

                        # Exact match
                        if actual_email.lower() == sender_email.lower():
                            print(f"[GmailSync] Matched by email {sender_email} to lead {lead['id']}")
                            return lead['id']

                        # Fuzzy match: check if username matches (handle different domains)
                        sender_username = sender_email.split('@')[0].lower()
                        contact_username = actual_email.split('@')[0].lower()
                        if sender_username and contact_username and sender_username == contact_username:
                            # Username matches, likely the same person
                            print(f"[GmailSync] Matched by username {sender_username} ({sender_email} ~ {actual_email}) to lead {lead['id']}")
                            return lead['id']

            # METHOD 3: Check subject line for company name
            company_name = lead.get('trigger_data', {}).get('company_name', '')
            if company_name and company_name.lower() in subject.lower():
                print(f"[GmailSync] Matched by company name '{company_name}' to lead {lead['id']}")
                return lead['id']

        return None

    except Exception as e:
        print(f"[GmailSync] Error matching lead: {e}")
        return None


def add_email_to_conversation(lead_id: int, email_data: Dict) -> bool:
    """
    Add an incoming email to a lead's conversation.

    Args:
        lead_id: Lead ID
        email_data: Email data dictionary

    Returns:
        True if successful, False otherwise
    """
    try:
        # Extract message content
        payload = email_data.get('payload', {})
        headers = {h['name']: h['value'] for h in payload.get('headers', [])}

        # Get body (simplified - just use snippet for now)
        snippet = email_data.get('snippet', '')
        if not snippet:
            # Try to get from payload body
            body_data = payload.get('body', {}).get('data', '')
            if body_data:
                import base64
                snippet = base64.urlsafe_b64decode(body_data).decode('utf-8', errors='ignore')

        # Create message object
        msg = {
            "content": snippet[:1000] if snippet else "(Empty message)",  # Limit length
            "sender": headers.get('From', 'Unknown'),
            "timestamp": headers.get('Date', datetime.now().strftime("%I:%M %p")),
            "isAi": False,
            "is_incoming": True,
            "message_id": email_data.get('id'),
            "thread_id": email_data.get('threadId')
        }

        # Add to lead's memory
        SQLiteStore.add_message_to_lead(lead_id, msg)

        # Update lead status to REPLIED
        SQLiteStore.update_lead(lead_id, {'status': 'REPLIED'})

        return True

    except Exception as e:
        print(f"[GmailSync] Error adding email to conversation: {e}")
        return False


def sync_incoming_emails() -> Dict:
    """
    Main sync function to fetch and process incoming emails.

    Returns:
        Dictionary with sync results
    """
    try:
        print("[GmailSync] Starting email sync...")

        # Get last sync time
        last_sync = get_last_sync_time()
        print(f"[GmailSync] Syncing messages since {last_sync}")

        # Fetch new messages
        messages = fetch_new_messages(since=last_sync)
        print(f"[GmailSync] Found {len(messages)} new messages")

        matched_count = 0
        unmatched_count = 0
        error_count = 0

        for msg in messages:
            try:
                # Extract headers
                payload = msg.get('payload', {})
                headers = {h['name']: h['value'] for h in payload.get('headers', [])}

                sender = headers.get('From', '')
                subject = headers.get('Subject', '')

                sender_email = extract_email_address(sender)
                thread_id = msg.get('threadId')

                # Skip messages sent by us (check From header, not To)
                stored_creds = SQLiteStore.get_gmail_credentials()
                if stored_creds and stored_creds['gmail_address'] in sender:
                    # This is an outgoing message we sent, skip it
                    continue

                # Match to lead
                lead_id = match_to_lead(sender_email, subject, thread_id)

                if lead_id:
                    # Add to conversation
                    if add_email_to_conversation(lead_id, msg):
                        matched_count += 1
                        print(f"[GmailSync] Matched email from {sender_email} to lead {lead_id}")
                    else:
                        error_count += 1
                else:
                    unmatched_count += 1
                    print(f"[GmailSync] No match found for email from {sender_email}")

            except Exception as e:
                print(f"[GmailSync] Error processing message: {e}")
                error_count += 1
                continue

        # Update last sync time
        update_last_sync_time(datetime.now())

        result = {
            "success": True,
            "total_messages": len(messages),
            "matched": matched_count,
            "unmatched": unmatched_count,
            "errors": error_count,
            "sync_time": datetime.now().isoformat()
        }

        print(f"[GmailSync] Sync complete: {matched_count} matched, {unmatched_count} unmatched")
        return result

    except Exception as e:
        print(f"[GmailSync] Sync failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "sync_time": datetime.now().isoformat()
        }


def get_sync_status() -> Dict:
    """
    Get the current sync status.

    Returns:
        Dictionary with sync status info
    """
    last_sync = get_last_sync_time()
    return {
        "last_sync": last_sync.isoformat() if last_sync else None,
        "time_since_sync": str(datetime.now() - last_sync) if last_sync else None
    }
