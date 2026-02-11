from datetime import datetime
from graph.state import AgentState, ExecutionStatus
from api.gmail_auth import get_credentials

def email_execution_node(state: AgentState):
    """
    Executes email sending via Gmail API.
    """
    print("--- EMAIL EXECUTION AGENT ---")

    content = state.get("outreach_content")
    contacts = state.get("contacts")

    if not content or not content.get("email_message") and not content.get("linkedin_message") or not contacts:
        return {
            "execution_status": {
                "message_sent": False,
                "timestamp": datetime.now().isoformat(),
                "contact_name": "None",
                "error": "Missing content or contacts"
            }
        }

    # Use email_message if available, otherwise fall back to linkedin_message
    message_body = content.get("email_message") or content.get("linkedin_message")
    target_name = contacts[0].get("name", "Unknown")
    target_email = contacts[0].get("email")

    if not target_email:
        print(f" >> ERROR: No email address found for {target_name}")
        return {
            "execution_status": {
                "message_sent": False,
                "timestamp": datetime.now().isoformat(),
                "contact_name": target_name,
                "error": "No email address"
            }
        }

    try:
        # Get Gmail credentials
        credentials = get_credentials()
        if not credentials:
            print(f" >> ERROR: Gmail not connected")
            return {
                "execution_status": {
                    "message_sent": False,
                    "timestamp": datetime.now().isoformat(),
                    "contact_name": target_name,
                    "error": "Gmail not connected"
                }
            }

        # Get the actual Gmail address from database
        from api.sqlite_store import SQLiteStore
        stored_creds = SQLiteStore.get_gmail_credentials()
        from_email = stored_creds['gmail_address'] if stored_creds else None
        if not from_email:
            print(f" >> ERROR: Could not retrieve Gmail address")
            return {
                "execution_status": {
                    "message_sent": False,
                    "timestamp": datetime.now().isoformat(),
                    "contact_name": target_name,
                    "error": "Could not retrieve Gmail address"
                }
            }

        # Create and send email
        from email.message import EmailMessage
        import base64
        from googleapiclient.discovery import build

        # Create email message
        email_msg = EmailMessage()
        email_msg['To'] = target_email
        email_msg['From'] = from_email  # Use actual Gmail address
        email_msg['Subject'] = f"Re: {contacts[0].get('company', 'Your Company')} - Inquiry"

        # Set message body
        email_msg.set_content(message_body)

        # Encode message
        encoded_message = base64.urlsafe_b64encode(email_msg.as_bytes()).decode()

        send_request = {
            'raw': encoded_message
        }

        # Send via Gmail API
        service = build('gmail', 'v1', credentials=credentials)
        result = service.users().messages().send(userId='me', body=send_request).execute()

        message_id = result.get('id')
        thread_id = result.get('threadId')

        print(f" >> EMAIL SENT TO: {target_name} ({target_email})")
        print(f" >> MESSAGE ID: {message_id}")
        print(f" >> THREAD ID: {thread_id}")
        print(f" >> CONTENT: {message_body[:100]}...")

        return {
            "execution_status": {
                "message_sent": True,
                "timestamp": datetime.now().isoformat(),
                "contact_name": target_name,
                "message_id": message_id,
                "thread_id": thread_id,
                "channel": "email"
            }
        }

    except Exception as e:
        print(f" >> ERROR SENDING EMAIL: {e}")
        return {
            "execution_status": {
                "message_sent": False,
                "timestamp": datetime.now().isoformat(),
                "contact_name": target_name,
                "error": str(e)
            }
        }
