from duckduckgo_search import DDGS
import json

def test_search():
    print("Testing DDG Search (new library)...")
    query = "factory closing liquidation auction industrial machinery"
    try:
        # The new library might have different interface? 
        # Usually it's DDGS().text(keywords, max_results=X)
        results = list(DDGS().text(query, max_results=5))
        print(f"Results found: {len(results)}")
        print(json.dumps(results, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_search()
