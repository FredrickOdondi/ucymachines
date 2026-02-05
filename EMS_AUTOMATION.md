# EMS Company Automation System

## Overview
This system automates the process of finding EMS (Electronic Manufacturing Service) companies and extracting LinkedIn profiles of key decision-makers and operations leaders.

## Features

### 1. Company Scraping
Automatically scrapes EMS company information from 6 major sources:
- ems-scout.de (German EMS providers)
- ems-anbieter.info (German directory)
- ems1.com (US directory)
- hardwarebee.com (International vendors)
- ensun.io (Global EMS search)

### 2. LinkedIn Profile Discovery
Finds LinkedIn profiles for target positions including:
- **Executive:** CEO, COO, CFO, CTO, CSCO, CMO
- **Management:** Plant Manager, Director of Operations, VP Manufacturing, etc.
- **German Positions:** Geschäftsführer, Leiter Produktion, Betriebsleiter, etc.

### 3. Data Export
Export results to CSV with company name, country, source, and LinkedIn profiles found.

## How to Use

### Frontend (React)
1. Click **"EMS Automation"** in the sidebar navigation
2. Click **"Scrape Companies"** to extract EMS companies from all sources
3. Select target positions using the checkboxes
4. Click **"Search LinkedIn"** to find profiles
5. Use search and country filters to refine results
6. Click **"Export to CSV"** to download data

### API Endpoints

#### Scrape EMS Companies
```
POST /ems/scrape
Response: { companies: [...], total_found: number }
```

#### Search LinkedIn Profiles
```
POST /ems/linkedin-search
Body: {
  "companies": [...],
  "positions": ["CEO", "COO", ...]
}
Response: { companies: [...], total_profiles_found: number }
```

## Architecture

### Frontend
- **File:** `frontend/src/pages/EmsAutomation.jsx`
- React component with filtering, searching, and export functionality
- Real-time status updates

### Backend
- **EMS Scraper:** `tools/ems_scraper.py` - Scrapes company data
- **LinkedIn Scraper:** `tools/linkedin_scraper.py` - Searches LinkedIn profiles
- **API Server:** `api/server.py` - FastAPI endpoints

## Configuration

The system uses the following environment variables (from `.env`):
- Required for LinkedIn searching: DuckDuckGo API (built-in, no key needed)

## Performance Notes
- Initial scraping may take 30-60 seconds depending on source response times
- LinkedIn searches use DuckDuckGo and are rate-limited to prevent blocking
- Results are deduplicated by company name

## Future Enhancements
- Database storage of scraped companies
- Scheduled automatic scraping
- More detailed company information (website, phone, etc.)
- Direct LinkedIn API integration (requires authentication)
- German language position matching
- Company size and revenue filtering
