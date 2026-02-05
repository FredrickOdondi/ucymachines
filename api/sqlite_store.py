"""
SQLite-based store for all data: EMS companies, LinkedIn profiles, and leads.
"""
import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

DB_PATH = Path(__file__).parent.parent / "data.db"

class SQLiteStore:
    """SQLite-based persistence for all application data."""
    
    @classmethod
    def init_db(cls):
        """Initialize database with all required tables."""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # EMS Companies table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ems_companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                country TEXT,
                source TEXT,
                website TEXT,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # LinkedIn Profiles table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS linkedin_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                position TEXT,
                url TEXT UNIQUE NOT NULL,
                title TEXT,
                snippet TEXT,
                search_position TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES ems_companies(id) ON DELETE CASCADE
            )
        """)
        
        # Leads table (for campaign leads)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trigger_data TEXT,
                company_data TEXT,
                contacts TEXT,
                outreach_content TEXT,
                execution_status TEXT,
                memory TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
        print("[SQLiteStore] Database initialized successfully")
    
    @classmethod
    def add_company(cls, company: Dict) -> int:
        """Add an EMS company. Returns company_id."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR IGNORE INTO ems_companies (name, country, source, website, metadata)
                VALUES (?, ?, ?, ?, ?)
            """, (
                company.get('name'),
                company.get('country'),
                company.get('source', 'unknown'),
                company.get('website', ''),
                json.dumps(company.get('metadata', {}))
            ))
            
            conn.commit()
            
            # Get the ID
            cursor.execute("SELECT id FROM ems_companies WHERE name = ?", (company.get('name'),))
            row = cursor.fetchone()
            conn.close()
            
            return row[0] if row else None
        except Exception as e:
            print(f"[SQLiteStore] Error adding company: {e}")
            return None
    
    @classmethod
    def add_companies_batch(cls, companies: List[Dict]) -> int:
        """Bulk add companies. Returns count of added companies."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            for company in companies:
                try:
                    cursor.execute("""
                        INSERT OR IGNORE INTO ems_companies (name, country, source, website, metadata)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        company.get('name'),
                        company.get('country'),
                        company.get('source', 'unknown'),
                        company.get('website', ''),
                        json.dumps(company.get('metadata', {}))
                    ))
                except Exception as e:
                    print(f"[SQLiteStore] Error inserting company {company.get('name')}: {e}")
                    continue
            
            conn.commit()
            
            # Get actual count of companies
            cursor.execute("SELECT COUNT(*) FROM ems_companies")
            total = cursor.fetchone()[0]
            conn.close()
            
            print(f"[SQLiteStore] Database now contains {total} companies")
            return total
        except Exception as e:
            print(f"[SQLiteStore] Error adding companies batch: {e}")
            return 0
    
    @classmethod
    def get_company_by_name(cls, name: str) -> Optional[Dict]:
        """Get a company by name."""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM ems_companies WHERE name = ?", (name,))
            row = cursor.fetchone()
            conn.close()
            
            return dict(row) if row else None
        except Exception as e:
            print(f"[SQLiteStore] Error getting company: {e}")
            return None
    
    @classmethod
    def get_all_companies(cls) -> List[Dict]:
        """Get all EMS companies."""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM ems_companies ORDER BY created_at DESC")
            rows = cursor.fetchall()
            conn.close()
            
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"[SQLiteStore] Error getting companies: {e}")
            return []
    
    @classmethod
    def add_profile(cls, company_id: int, profile: Dict) -> int:
        """Add a LinkedIn profile for a company. Returns profile_id."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR IGNORE INTO linkedin_profiles 
                (company_id, name, position, url, title, snippet, search_position)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                company_id,
                profile.get('name'),
                profile.get('position'),
                profile.get('url'),
                profile.get('title', ''),
                profile.get('snippet', ''),
                profile.get('search_position', '')
            ))
            
            conn.commit()
            
            cursor.execute("SELECT id FROM linkedin_profiles WHERE url = ?", (profile.get('url'),))
            row = cursor.fetchone()
            conn.close()
            
            return row[0] if row else None
        except Exception as e:
            print(f"[SQLiteStore] Error adding profile: {e}")
            return None
    
    @classmethod
    def add_profiles_batch(cls, company_id: int, profiles: List[Dict]) -> int:
        """Bulk add profiles for a company. Returns count of added profiles."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            added = 0
            for profile in profiles:
                try:
                    cursor.execute("""
                        INSERT OR IGNORE INTO linkedin_profiles 
                        (company_id, name, position, url, title, snippet, search_position)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        company_id,
                        profile.get('name'),
                        profile.get('position'),
                        profile.get('url'),
                        profile.get('title', ''),
                        profile.get('snippet', ''),
                        profile.get('search_position', '')
                    ))
                    added += 1
                except Exception as e:
                    continue
            
            conn.commit()
            conn.close()
            return added
        except Exception as e:
            print(f"[SQLiteStore] Error adding profiles batch: {e}")
            return 0
    
    @classmethod
    def get_profiles_for_company(cls, company_id: int) -> List[Dict]:
        """Get all LinkedIn profiles for a company."""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM linkedin_profiles 
                WHERE company_id = ? 
                ORDER BY created_at DESC
            """, (company_id,))
            rows = cursor.fetchall()
            conn.close()
            
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"[SQLiteStore] Error getting profiles: {e}")
            return []
    
    @classmethod
    def get_all_profiles(cls, limit: int = 1000) -> List[Dict]:
        """Get all LinkedIn profiles with company info."""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    lp.*,
                    ec.name as company_name,
                    ec.country as company_country
                FROM linkedin_profiles lp
                LEFT JOIN ems_companies ec ON lp.company_id = ec.id
                ORDER BY lp.created_at DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            conn.close()
            
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"[SQLiteStore] Error getting all profiles: {e}")
            return []
    
    # ============ Lead management methods ============
    
    @classmethod
    def add_lead(cls, lead_data: Dict) -> Optional[int]:
        """Add a lead. Returns lead_id."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO leads (trigger_data, company_data, contacts, outreach_content, execution_status, memory, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                json.dumps(lead_data.get('trigger_data', {})),
                json.dumps(lead_data.get('company_data', {})),
                json.dumps(lead_data.get('contacts', [])),
                json.dumps(lead_data.get('outreach_content', {})),
                json.dumps(lead_data.get('execution_status', {})),
                json.dumps(lead_data.get('memory', {})),
                lead_data.get('status', 'pending')
            ))
            
            conn.commit()
            lead_id = cursor.lastrowid
            conn.close()
            
            return lead_id
        except Exception as e:
            print(f"[SQLiteStore] Error adding lead: {e}")
            return None
    
    @classmethod
    def get_leads(cls, limit: int = 100) -> List[Dict]:
        """Get all leads."""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM leads 
                ORDER BY created_at DESC 
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            conn.close()
            
            leads = []
            for row in rows:
                lead = dict(row)
                # Parse JSON fields
                for field in ['trigger_data', 'company_data', 'contacts', 'outreach_content', 'execution_status', 'memory']:
                    try:
                        lead[field] = json.loads(lead[field]) if lead[field] else {}
                    except:
                        pass
                leads.append(lead)
            
            return leads
        except Exception as e:
            print(f"[SQLiteStore] Error getting leads: {e}")
            return []
    
    @classmethod
    def get_lead(cls, lead_id: int) -> Optional[Dict]:
        """Get a single lead by ID."""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM leads WHERE id = ?", (lead_id,))
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            lead = dict(row)
            # Parse JSON fields
            for field in ['trigger_data', 'company_data', 'contacts', 'outreach_content', 'execution_status', 'memory']:
                try:
                    lead[field] = json.loads(lead[field]) if lead[field] else {}
                except:
                    pass
            
            return lead
        except Exception as e:
            print(f"[SQLiteStore] Error getting lead: {e}")
            return None
    
    @classmethod
    def update_lead(cls, lead_id: int, updates: Dict) -> Optional[Dict]:
        """Update a lead."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            update_fields = []
            update_values = []
            
            if 'status' in updates:
                update_fields.append("status = ?")
                update_values.append(updates['status'])
            
            if 'outreach_content' in updates:
                update_fields.append("outreach_content = ?")
                update_values.append(json.dumps(updates['outreach_content']))
            
            if 'execution_status' in updates:
                update_fields.append("execution_status = ?")
                update_values.append(json.dumps(updates['execution_status']))
            
            if update_fields and update_values:
                update_fields.append("updated_at = CURRENT_TIMESTAMP")
                update_values.append(lead_id)
                
                query = f"UPDATE leads SET {', '.join(update_fields)} WHERE id = ?"
                cursor.execute(query, update_values)
                conn.commit()
            
            conn.close()
            return cls.get_lead(lead_id)
        except Exception as e:
            print(f"[SQLiteStore] Error updating lead: {e}")
            return None
    
    @classmethod
    def add_message_to_lead(cls, lead_id: int, message: Dict) -> Optional[Dict]:
        """Add a message to a lead's memory."""
        try:
            lead = cls.get_lead(lead_id)
            if not lead:
                return None
            
            memory = lead.get('memory', {})
            if 'messages' not in memory:
                memory['messages'] = []
            
            memory['messages'].append(message)
            
            return cls.update_lead(lead_id, {'memory': memory})
        except Exception as e:
            print(f"[SQLiteStore] Error adding message: {e}")
            return None
    
    @classmethod
    def clear_all(cls):
        """Clear all data (use with caution)."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM linkedin_profiles")
            cursor.execute("DELETE FROM ems_companies")
            cursor.execute("DELETE FROM leads")
            
            conn.commit()
            conn.close()
            print("[SQLiteStore] All data cleared")
        except Exception as e:
            print(f"[SQLiteStore] Error clearing data: {e}")
    
    @classmethod
    def get_stats(cls) -> Dict:
        """Get database statistics."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM ems_companies")
            companies_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM linkedin_profiles")
            profiles_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM leads")
            leads_count = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                "companies": companies_count,
                "linkedin_profiles": profiles_count,
                "leads": leads_count,
                "database_path": str(DB_PATH)
            }
        except Exception as e:
            print(f"[SQLiteStore] Error getting stats: {e}")
            return {}


# Initialize on import
SQLiteStore.init_db()
