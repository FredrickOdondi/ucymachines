import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

def test_llm(model_name):
    print(f"Testing model: {model_name}")
    try:
        llm = ChatGoogleGenerativeAI(
            temperature=0, 
            model=model_name, 
            google_api_key=os.getenv("GOOGLE_API_KEY")
        )
        response = llm.invoke("Say 'System Operational'")
        print(f"SUCCESS: {response.content}")
        return True
    except Exception as e:
        print(f"FAILURE for {model_name}: {e}")
        return False

if __name__ == "__main__":
    models_to_try = [
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
        "gemini-flash-lite-latest"
    ]
    
    for model in models_to_try:
        if test_llm(model):
            print(f"\nRecommended model for configuration: {model}")
            break
