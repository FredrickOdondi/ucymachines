# Gmail Integration Testing Guide

## How to Verify Gmail is Working

### Step 1: Connect Your Gmail Account

1. Go to the **Config** page
2. Click the **"Sign in with Google"** button (white button with Google logo)
3. Complete the Google OAuth flow
4. Grant permissions to:
   - ✉️ Send emails as you
   - 📬 Read your emails
5. Verify you see **"✅ Gmail Connected"** with your email address

### Step 2: Send a Test Email

1. On the Config page, click **"SEND TEST EMAIL"** (green button)
2. You should see an alert: ✅ Test email sent successfully!
3. **Check your Gmail inbox** - you should receive a test email from yourself
4. The email will be from your own address and titled "MachineryLeads - Gmail Integration Test"

**If you receive the test email → Gmail is working! ✅**

### Step 3: Send an Email to a Lead

1. Go to the **Dashboard** page
2. Find a lead with an email address (look for 📧 icon)
3. Click **Approve** on the lead
4. Wait for the AI to generate a message (30-60 seconds)
5. The email will be sent automatically
6. Check the lead's status - it should show **email_status: "sent"**

### Step 4: Test Receiving Replies

1. From another email account, **reply to one of the sent emails**
2. Go to Config page and click **"SYNC NOW"** (purple button)
3. You should see: ✅ Sync complete! Matched to leads: 1
4. Go to **Inbox** page
5. Find the lead - they should show **"REPLIED - EMAIL EXCHANGE"**
6. Open the conversation to see the reply with **📧 INCOMING EMAIL** badge

### Step 5: Send Manual Reply from Inbox

1. In the **Inbox** page, select a conversation
2. Type a message in the input box
3. Press Enter or click Send
4. The email is sent via Gmail API
5. Check your Gmail "Sent" folder to verify

---

## What Each Status Means

### Config Page

| Status | Meaning |
|--------|---------|
| NOT CONNECTED (gray dot) | No Gmail account connected |
| CONNECTED (green pulse) | Gmail connected and ready |
| Never synced | Haven't checked for incoming emails yet |
| Last sync: [date] | When incoming emails were last checked |

### Lead Status

| Status | Meaning |
|--------|---------|
| `email_status: pending` | Lead created, email not sent yet |
| `email_status: sent` | Email sent successfully |
| `status: REPLIED` | Lead responded to your email |

---

## Troubleshooting

### ❌ "Gmail not connected" error

**Solution:**
1. Go to Config page
2. Click "Sign in with Google"
3. Complete OAuth flow

### ❌ Test email fails to send

**Check:**
1. Are credentials in `.env` correct?
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
2. Is Gmail API enabled in Google Cloud Console?
3. Is redirect URI correct? `http://localhost:8000/gmail/callback`

**Fix:**
```bash
# Verify .env has correct values
cat .env | grep GMAIL

# Test OAuth flow manually
curl http://localhost:8000/gmail/auth-url
```

### ❌ Incoming replies not appearing

**Check:**
1. Did you click "SYNC NOW" on Config page?
2. Is sender's email in lead's contacts?
3. Check if `.last_gmail_sync` file exists

**Fix:**
```bash
# Manually trigger sync via API
curl -X POST http://localhost:8000/email/sync

# Check sync status
curl http://localhost:8000/email/sync-status
```

### ❌ "Lead has no email address"

**Cause:** Lead's contact info doesn't include an email field

**Fix:**
1. Add email to lead's contacts:
```bash
# Via API
curl -X PUT http://localhost:8000/dashboard/leads/{lead_id} \
  -H "Content-Type: application/json" \
  -d '{"contacts": [{"name": "John Doe", "email": "john@example.com"}]}'
```

---

## Quick Verification Checklist

- [ ] Config page shows "CONNECTED" (green pulse)
- [ ] Test email received in inbox
- [ ] Dashboard lead shows email icon (📧)
- [ ] Approving lead sends email automatically
- [ ] Sent emails appear in Gmail "Sent" folder
- [ ] Replies appear in Inbox after sync
- [ ] Lead status updates to "REPLIED"

---

## Real-World Testing Scenario

### Complete End-to-End Test

1. **Setup:**
   - Create a test lead with your personal email
   - Use the API or Dashboard to add a lead

2. **Send:**
   - Approve the lead in Dashboard
   - Wait for AI to generate message
   - Receive email in your personal inbox

3. **Reply:**
   - From personal email, reply to the message
   - Go to Config → Click "SYNC NOW"
   - Verify sync shows: "Matched to leads: 1"

4. **Verify:**
   - Go to Inbox
   - Find the conversation
   - See both sent message and reply
   - Status badge shows "REPLIED"

5. **Follow-up:**
   - Type a new message in Inbox
   - Click Send
   - Check personal inbox for new email

---

All tests passing? 🎉 **Gmail integration is working perfectly!**
