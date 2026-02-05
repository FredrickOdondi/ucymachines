from ddgs import DDGS
import requests
from bs4 import BeautifulSoup

class WebTools:
    @staticmethod
    def search_signals(query: str = "factory closing liquidation auction machinery") -> list[dict]:
        """
        Searches for industrial signals using DuckDuckGo.
        """
        print(f"  [WebTools] Searching DDG for: {query}")
        results = []
        try:
            # Correct DDGS API usage - text() is a method that returns generator
            ddgs = DDGS()
            search_results = ddgs.text(query, max_results=10)
            
            for r in search_results:
                results.append({
                    "title": r.get("title", ""),
                    "content": r.get("body", ""), 
                    "source": r.get("href", ""),
                    "date": "Recent"
                })
                
            print(f"  [WebTools] Found {len(results)} real results")
        except Exception as e:
            print(f"  [WebTools] Search Error: {e}")
        
        return results

    @staticmethod
    def scrape_company_page(url: str) -> dict:
        """
        Scrapes a company website to extract text for qualification.
        """
        print(f"  [WebTools] Scraping: {url}")
        try:
            # Timeout is important to avoid hanging
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.content, 'html.parser')
                # Get title and manageable chunk of text
                text = soup.get_text(separator=' ', strip=True)[:2000]
                return {
                    "url": url,
                    "text_content": text,
                    "status": "success"
                }
        except Exception as e:
            print(f"  [WebTools] Scrape Error: {e}")
        
        return {"url": url, "text_content": "", "status": "error"}

if __name__ == "__main__":
    # Test
    print(WebTools.search_signals())
