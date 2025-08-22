# 🧑‍🔬 Research Assistant

A **multi-agent research automation system** built with **LangGraph**, **LangChain**, and **Google Gemini**.
This project demonstrates how to combine **memory**, **human-in-the-loop workflows**, and **controllability** to build a customized AI-powered research pipeline.

---

## 🚀 Overview

Research often requires analysts to gather information, interview experts, and synthesize findings into reports. This assistant automates much of that process by orchestrating multiple AI agents:

1. **Source Selection** – Choose from web search or Wikipedia.
2. **Planning** – Break a topic into sub-topics with dedicated AI analysts.
3. **Human-in-the-loop** – Refine and approve sub-topics before research begins.
4. **Multi-turn Interviews** – Analysts interview AI experts in a structured conversation.
5. **Parallel Research** – Interviews and document retrieval happen simultaneously.
6. **Report Writing** – Sections are compiled, then combined into a structured report with an introduction and conclusion.

---

## ✨ Features

* 🔍 Web & Wikipedia search integration (Tavily + LangChain loaders)
* 🧩 Modular LangGraph sub-graphs for interviews
* 👩‍💻 Human-in-the-loop feedback before interviews
* 📝 Automatic section and report writing
* 🧠 Uses **Gemini 2.5 Pro** as the LLM
* ⚡ Parallel execution with `map-reduce`

---

## 📂 Project Structure

```
research-assistant/
├── main.py              # Core research graph orchestration
├── schemas.py           # Pydantic models for structured outputs
├── states.py            # State definitions for LangGraph
├── prompts.py           # Instruction templates for analysts & experts
├── output.jpeg          # Workflow diagram image
└── README.md            # Project documentation
```

---

## 🛠️ Tech Stack

* [LangGraph](https://github.com/langchain-ai/langgraph) – stateful multi-agent orchestration
* [LangChain](https://www.langchain.com/) – LLM tooling
* [Google Gemini](https://ai.google/) – chat model for reasoning & writing
* [Tavily Search](https://python.langchain.com/docs/integrations/tools/tavily_search) – web search integration
* [WikipediaLoader](https://python.langchain.com/docs/integrations/document_loaders/wikipedia) – document loader

---

## ⚙️ Installation

```bash
# clone the repository
git clone https://github.com/your-username/research-assistant.git
cd research-assistant

# create virtual environment
python -m venv venv
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows

# install dependencies
pip install -r requirements.txt
```

---

## ▶️ Usage

```python
from main import graph

# run the research pipeline
topic = "Future of Renewable Energy"
config = {"topic": topic, "max_analysts": 3}

for step in graph.stream(config):
    print(step)
```

---

## 📊 Workflow

![Research Assistant Workflow](./output.jpeg)

---

## 📌 Example Output

* Introduction
* Insights from each sub-topic interview
* Conclusion
* Sources


