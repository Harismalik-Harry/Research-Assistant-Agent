# Research Assistant Agent

A powerful, AI-powered research assistant that generates multi-analyst deep-dive reports on any topic.

![Research Agent Screenshot](output.jpeg)

## Features

- **Multi-Analyst AI**: Generates diverse analyst personas (e.g., "AI Safety Researcher", "Tech Economist") to interview experts.
- **Parallel Execution**: Analysts conduct interviews via Tavily search and Wikipedia in parallel.
- **Human-in-the-Loop**: Review and approve analyst personas before the research begins.
- **Live Progress**: Watch the agent think in real-time with a beautiful streaming UI.
- **Full Reports**: Generates comprehensive markdown reports with introduction, insights, conclusion, and citations.

## Tech Stack

- **Backend**: FastAPI, LangGraph, Google Gemini, SQLite, SQLAlchemy, SSA-Starlette
- **Frontend**: React, Vite, Tailwind-like CSS variables, Lucide Icons

## Docker Setup (Recommended)

Run the entire stack with a single command.

1. Create a `.env` file in the root directory (or use connection from backend/.env if you prefer):
   ```bash
   GOOGLE_API_KEY=your_key
   TAVILY_API_KEY=your_key
   GEMINI_MODEL=gemini-2.0-flash  # Optional, defaults to gemini-2.0-flash
   ```

2. Run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Open `http://localhost` in your browser.

## Manual Setup

### Prerequisites

- Python 3.10+
- Node.js 20+
- Google Gemini API Key
- Tavily Search API Key

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your API keys:
# GOOGLE_API_KEY=...
# TAVILY_API_KEY=...
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

## Running the App manually

### Start the Backend

In a new terminal:
```bash
cd backend
source venv/bin/activate
uvicorn api:app --reload --port 8000
```
The API will be available at `http://localhost:8000`.
Docs at `http://localhost:8000/docs`.

### Start the Frontend

In another terminal:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` to start using the Research Agent!

## Usage Guide

1. **Enter a Topic**: "The future of quantum computing in drug discovery"
2. **Select Analysts**: Choose how many analysts (1-5) you want.
3. **Review Plan**: The agent will generate analyst personas. Approve them or ask for changes.
4. **Watch it Work**: See real-time logs as analysts search the web and interview experts.
5. **Read Report**: Get a full standardized report with citations.
