"""
LeadStore adapter with optional Postgres (NocoDB-backed) persistence.

Behavior:
- If Postgres (psycopg2) is available and connection env vars are provided,
  the store will persist leads to a `leads` table. This database is the same
  one NocoDB would use, so NocoDB will surface the rows automatically.
- If Postgres is unavailable or connection fails, the implementation falls
  back to the in-memory store used previously.

Environment variables (optional, required for Postgres mode):
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

"""
import os
import json
from datetime import datetime

DB_HOST = os.getenv("DB_HOST", os.getenv("PGHOST"))
DB_PORT = int(os.getenv("DB_PORT", os.getenv("PGPORT", 5432)))
DB_USER = os.getenv("DB_USER", os.getenv("PGUSER"))
DB_PASSWORD = os.getenv("DB_PASSWORD", os.getenv("PGPASSWORD"))
DB_NAME = os.getenv("DB_NAME", os.getenv("PGDATABASE"))

USE_DB = all([DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME])

class LeadStore:
    """Adapter that uses Postgres when available, otherwise in-memory."""
    _in_memory = []

    # Postgres connection placeholder
    _conn = None

    @classmethod
    def _ensure_db(cls):
        if not USE_DB:
            return False
        if cls._conn:
            return True
        try:
            import psycopg2
            from psycopg2.extras import Json

            cls._conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                dbname=DB_NAME,
            )
            cls._conn.autocommit = True
            cur = cls._conn.cursor()
            # Create leads table if not exists
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS leads (
                    id SERIAL PRIMARY KEY,
                    trigger_data JSONB,
                    company_data JSONB,
                    contacts JSONB,
                    outreach_content JSONB,
                    execution_status JSONB,
                    memory JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                )
                """
            )
            cur.close()
            print("[LeadStore] Connected to Postgres and ensured `leads` table exists")
            return True
        except Exception as e:
            print(f"[LeadStore] Postgres not available or connection failed: {e}")
            cls._conn = None
            return False

    @classmethod
    def add_lead(cls, lead_data: dict):
        # Minimal validation
        if "trigger_data" not in lead_data:
            return

        contacts = lead_data.get("contacts", [])
        if not contacts:
            return

        primary_contact = contacts[0]
        if not primary_contact.get("email") or "@" not in primary_contact.get("email"):
            return

        # Try to persist to Postgres via NocoDB DB if available
        if cls._ensure_db():
            try:
                cur = cls._conn.cursor()
                cur.execute(
                    "INSERT INTO leads (trigger_data, company_data, contacts, outreach_content, execution_status, memory) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                    (
                        json.dumps(lead_data.get("trigger_data")),
                        json.dumps(lead_data.get("company_data", {})),
                        json.dumps(lead_data.get("contacts", [])),
                        json.dumps(lead_data.get("outreach_content", {})),
                        json.dumps(lead_data.get("execution_status", {})),
                        json.dumps(lead_data.get("memory", {})),
                    ),
                )
                rowid = cur.fetchone()[0]
                cur.close()
                print(f"  [LeadStore] ✓ Saved lead to Postgres (id={rowid})")
                return
            except Exception as e:
                print(f"  [LeadStore] Error saving to Postgres: {e}")

        # Fallback in-memory
        exists = any(
            l.get("trigger_data", {}).get("company_name") == lead_data.get("trigger_data", {}).get("company_name")
            for l in cls._in_memory
        )
        if not exists:
            lead_data["id"] = len(cls._in_memory) + 1
            if "company_data" not in lead_data:
                lead_data["company_data"] = {"industry": "Unknown", "location": "Unknown"}
            if "outreach_content" not in lead_data:
                lead_data["outreach_content"] = {}
            cls._in_memory.insert(0, lead_data)
            print(f"  [LeadStore] ✓ Saved lead (in-memory): {lead_data.get('trigger_data', {}).get('company_name')} with contact {primary_contact.get('email')}")

    @classmethod
    def get_leads(cls):
        # If using DB, fetch rows
        if cls._ensure_db():
            try:
                cur = cls._conn.cursor()
                cur.execute("SELECT id, trigger_data, company_data, contacts, outreach_content, execution_status, memory, created_at FROM leads ORDER BY id DESC")
                rows = cur.fetchall()
                cur.close()
                leads = []
                for r in rows:
                    leads.append({
                        "id": r[0],
                        "trigger_data": r[1],
                        "company_data": r[2],
                        "contacts": r[3],
                        "outreach_content": r[4],
                        "execution_status": r[5],
                        "memory": r[6],
                        "created_at": r[7].isoformat() if r[7] else None,
                    })
                return leads
            except Exception as e:
                print(f"  [LeadStore] Error reading from Postgres: {e}")

        return cls._in_memory

    @classmethod
    def update_lead(cls, lead_id: int, updates: dict):
        if cls._ensure_db():
            try:
                cur = cls._conn.cursor()
                # Only support updating outreach_content and status for now
                if "outreach_content" in updates:
                    cur.execute("UPDATE leads SET outreach_content = %s WHERE id = %s", (json.dumps(updates["outreach_content"]), lead_id))
                if "status" in updates:
                    # store status inside execution_status JSON
                    cur.execute("UPDATE leads SET execution_status = jsonb_set(coalesce(execution_status::jsonb, '{}'::jsonb), '{status}', to_jsonb(%s::text), true) WHERE id = %s", (updates["status"], lead_id))
                cur.close()
                return cls.get_leads()
            except Exception as e:
                print(f"  [LeadStore] Error updating Postgres lead: {e}")

        # In-memory update
        for lead in cls._in_memory:
            if lead.get("id") == lead_id:
                if "status" in updates:
                    lead["status"] = updates["status"]
                if "outreach_content" in updates and isinstance(updates["outreach_content"], dict):
                    if not lead.get("outreach_content"):
                        lead["outreach_content"] = {}
                    lead["outreach_content"].update(updates["outreach_content"])
                return lead
        return None

    @classmethod
    def add_message(cls, lead_id: int, message: dict):
        if cls._ensure_db():
            try:
                # Append message to a messages array stored in memory column 'memory' (or new column), for simplicity update memory.messages
                cur = cls._conn.cursor()
                cur.execute("SELECT memory FROM leads WHERE id = %s", (lead_id,))
                row = cur.fetchone()
                mem = row[0] or {}
                msgs = mem.get("messages", [])
                msgs.append(message)
                mem["messages"] = msgs
                cur.execute("UPDATE leads SET memory = %s WHERE id = %s", (json.dumps(mem), lead_id))
                cur.close()
                return cls.get_leads()
            except Exception as e:
                print(f"  [LeadStore] Error adding message to Postgres lead: {e}")

        for lead in cls._in_memory:
            if lead.get("id") == lead_id:
                if "messages" not in lead:
                    lead["messages"] = []
                lead["messages"].append(message)
                return lead
        return None

    @classmethod
    def clear(cls):
        if cls._ensure_db():
            try:
                cur = cls._conn.cursor()
                cur.execute("TRUNCATE TABLE leads RESTART IDENTITY CASCADE")
                cur.close()
                print("[LeadStore] Cleared leads table in Postgres")
                return
            except Exception as e:
                print(f"[LeadStore] Error truncating Postgres leads table: {e}")
        cls._in_memory = []
