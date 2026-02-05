# UCyMachines - Machinery Leads Automation Platform

An AI-powered platform for discovering EMS companies and finding key decision-makers on LinkedIn. Automates the entire lead generation and enrichment pipeline with intelligent decision-making agents.

## Features

### 🏭 EMS Company Scraping
- Scrapes EMS (Electronics Manufacturing Services) companies from multiple sources
- Filters and deduplicates company data
- Enriches with location and industry metadata
- Processes first 20 companies at a time (optimized for accuracy)

### 🔗 LinkedIn Profile Discovery
- Finds LinkedIn profiles for target positions (CEO, COO, CFO, Directors, etc.)
- Extracts person names and actual positions from search results
- Filters out "Unknown" entries - only valid contact information stored
- Rate-limited to avoid API throttling
- Batch processing with progress tracking

### 🗄️ SQLite Persistence
- All scraped companies stored in persistent SQLite database
- LinkedIn profiles linked to companies
- Lead data with outreach content
- Data survives browser refreshes and application restarts

### 🤖 AI-Powered Agents
- **Trigger Detector**: Identifies relevant signals and opportunities
- **Company Qualifier**: Validates company relevance
- **Decision Maker Finder**: Locates key stakeholders
- **LinkedIn Sender**: Manages outreach automation
- **Outreach Composer**: Personalizes messaging

### 📊 Real-time Dashboard
- Track discovered companies and profiles
- Monitor campaign performance
- View leads with contact information
- Filter by country and company name
- Export to CSV

## Tech Stack

**Backend:**
- FastAPI (Python)
- LangGraph for AI workflow orchestration
- SQLite for persistent storage
- DuckDuckGo Search API

**Frontend:**
- React with Vite
- Tailwind CSS
- Real-time data syncing

**AI/ML:**
- LangChain for LLM integration
- Google Generative AI & OpenAI support
- Multi-agent system with memory tracking

## Installation

```bash
# Clone repository and install dependencies
git clone https://github.com/FredrickOdondi/ucymachines.git
cd ucymachines

# Backend setup
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
```

## Running the Application

```bash
# Terminal 1: Start backend (port 8000)
python3 -m uvicorn api.server:app --host 0.0.0.0 --port 8000

# Terminal 2: Start frontend (port 5173)
cd frontend
npm run dev
```

Access the UI at `http://localhost:5173`

## API Endpoints

### EMS Automation
- `POST /ems/scrape` - Scrape EMS companies and save to database
- `POST /ems/linkedin-search` - Search LinkedIn profiles for companies
- `GET /database/companies` - Get all scraped companies
- `GET /database/profiles` - Get all found LinkedIn profiles
- `GET /database/stats` - Database statistics

### Dashboard
- `GET /dashboard/stats` - Campaign statistics
- `GET /dashboard/leads` - All discovered leads
- `PUT /dashboard/leads/{lead_id}` - Update lead
- `POST /dashboard/leads/{lead_id}/messages` - Add message to lead

### Scheduler
- `POST /scheduler/start` - Start automated searches
- `POST /scheduler/stop` - Stop automated searches
- `GET /scheduler/status` - Check scheduler status

## Project Structure

```
├── agents/              # AI agents for decision making
├── api/                 # FastAPI backend
│   ├── server.py       # Main API routes
│   ├── service.py      # Business logic
│   └── sqlite_store.py # Database persistence
├── graph/               # LangGraph workflow
├── tools/               # Scraping tools
│   ├── ems_scraper.py
│   └── linkedin_scraper.py
├── frontend/            # React UI
│   └── src/
│       └── pages/
│           └── EmsAutomation.jsx  # Main automation page
└── data.db             # SQLite database (persistent)
```

## Key Features Explained

### Data Persistence
- Companies scraped via `/ems/scrape` are saved to SQLite
- LinkedIn profiles are linked to companies with foreign keys
- Frontend loads persisted data on mount via `/database/companies`
- Data survives browser refreshes and server restarts

### Quality Assurance
- Only profiles with valid extracted names are saved (no "Unknown")
- Invalid entries are automatically filtered
- First 20 companies processed per batch (optimized for quality)
- Deduplication by company name and profile URL

### Rate Limiting
- 0.5 second delay between LinkedIn searches
- Batch processing with automatic retries
- Configurable timeout protection (5 seconds per search)

## Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

## Database Schema

### ems_companies
- id, name (unique), country, source, website, metadata, created_at, updated_at

### linkedin_profiles  
- id, company_id (FK), name, position, url (unique), title, snippet, created_at

### leads
- id, trigger_data, company_data, contacts, outreach_content, status, created_at, updated_at

## Expanding the System

### Add More Data Sources
Edit `tools/ems_scraper.py` and add new scraper methods to `scrape_all()`

### Customize LinkedIn Search
Modify `TARGET_POSITIONS` in `tools/linkedin_scraper.py`

### Deploy
Push project to production-ready hosting:
```bash
# Docker containerization ready
# Added to GitHub for CI/CD integration
```

## Contributing

Pull requests welcome! Areas for contribution:
- Additional EMS data sources
- Enhanced LinkedIn profile matching
- Advanced filtering and segmentation
- Multi-language support

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, open a GitHub issue or contact the development team.

---

**Built with ❤️ for B2B lead generation automation**
