# MachineryLeads Software Guide

## 1. Introduction
**MachineryLeads** is an intelligent automation system designed to find, qualify, and contact potential leads in the industrial machinery market. It acts as an autonomous sales development representative (SDR) that works 24/7 to identify factories closing down, liquidation auctions, or companies selling surplus equipment.

## 2. How It Works
The software operates through a pipeline of specialized "AI Agents," each handling a specific part of the sales process:

1.  **Trigger Detection Agent**: Continuously scans the web (news, auction sites, press releases) for "signals" like "factory closing" or "liquidation." It reads hundreds of search results to find companies that might need to sell machinery.
2.  **Company Qualifier Agent**: Once a potential lead is found, this agent investigates the company to ensure it matches your criteria (e.g., correct industry, verified existence).
3.  **Decision Maker Finder**: Finds the right person to contact at that company (e.g., Plant Manager, Operations Director) and looks for their public contact info (LinkedIn profile).
4.  **Outreach Composer Agent**: Uses advanced AI to write a personalized message. It references the specific news signal (e.g., "I saw news about your Ohio plant closing...") to make the message relevant and human-like.
5.  **LinkedIn Sender**: Queues or sends the message to the prospect.

## 3. Self-Hosting Guide
You can host this software on your own computer or a private server.

### Prerequisites
*   **Computer**: A Mac, Linux, or Windows machine.
*   **Terminal**: Ability to run text commands.
*   **Python**: Version 3.9 or higher installed.
*   **Node.js**: Version 18 or higher installed.

### Installation Steps

1.  **Download the Code**
    Download the project files to a folder on your computer.

2.  **Configuration**
    Create a file named `.env` in the main folder. You will need API keys for the services the AI uses.
    ```text
    GROQ_API_KEY=your_key_here
    TAVILY_API_KEY=your_key_here
    ```

3.  **Install Backend Dependencies**
    Open your terminal in the project folder and run:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Install Frontend Dependencies**
    In the terminal, go to the frontend folder and install:
    ```bash
    cd frontend
    npm install
    ```

5.  **Start the Application**
    You will need two terminal windows running at the same time.
    
    *Window 1 (Backend):*
    ```bash
    python3 -m uvicorn api.server:app --reload --port 8000
    ```
    
    *Window 2 (Frontend):*
    ```bash
    cd frontend
    npm run dev
    ```

6.  **Access the Dashboard**
    Open your web browser and go to `http://localhost:5173`.

## 4. AI & API Costs
The system relies on AI models to analyze text and write messages. Below are the cost details.

### Current Configuration (Groq)
The software is currently configured to use **Groq** (running Llama 3 models), which offers extremely fast performance and low costs (often free usage tiers available for development).

### Gemini API Costs (Google)
If you choose to switch the AI provider to Google's **Gemini API**, here are the estimated costs based on standard market pricing:

#### Gemini 1.5 Flash (Recommended for Speed & Cost)
*   **Best for**: Scanning large amounts of web results, filtering leads, and basic message drafting.
*   **Cost**:
    *   **Free Tier**: Available (rate limited).
    *   **Paid**: ~$0.35 per 1 million input tokens (approx 700,000 words).
    *   **Output**: ~$1.05 per 1 million output tokens.
*   *Estimate*: Running this 24/7 for moderate volume might cost **<$5/month**.

#### Gemini 1.5 Pro (Best for Intelligence)
*   **Best for**: Complex decision making and deeply personalized emails.
*   **Cost**:
    *   **Free Tier**: Available (lower rate limits).
    *   **Paid**: ~$3.50 per 1 million input tokens.
    *   **Output**: ~$10.50 per 1 million output tokens.
*   *Estimate*: Significantly higher quality but costs ~10x more than Flash.

**Note**: You will also need a **Tavily Search API** key for web browsing, which has a free tier (1,000 searches/month) and paid plans starting around $29/month.
