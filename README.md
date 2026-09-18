# 🌱 Eco Scientist AI

AI-powered environmental analysis platform using RAG (Retrieval Augmented Generation), scientific knowledge bases, and Azure GPT.

The system analyzes environmental problems like:

- Low rainfall
- Soil degradation
- Biodiversity loss
- Climate stress
- Land use impact

and generates scientific recommendations.

---

# 🏗️ System Architecture

            User
             |
             |
         Frontend
        (React/Vite)
             |
             |
    Node.js Express Backend
             |
             |
      FastAPI AI Service
             |
    --------------------
    |                  |
   RAG              Azure GPT
    |
    Chroma Vector DB
    |
    Scientific Knowledge Base



---

# 📂 Project Structure



eco-scientist-ai/

│
├── frontend/
│ └── React + Vite Application
│
├── backend/
│ ├── Express API
│ ├── MongoDB Integration
│ ├── User Management
│ └── Conversation Memory
│
└── ai-service/
├── FastAPI Service
├── RAG Pipeline
├── Vector Database
├── Azure OpenAI Integration
└── Streaming Responses



---

# 🚀 Features


## AI Service

✅ Retrieval Augmented Generation (RAG)

✅ Scientific knowledge retrieval

✅ Chroma vector database

✅ HuggingFace embeddings

✅ Azure OpenAI GPT integration

✅ Streaming AI responses using SSE


---

## Backend

✅ Node.js + Express

✅ MongoDB conversation storage

✅ User management

✅ Chat APIs

✅ AI service proxy

✅ Streaming proxy


---

## Current AI Capabilities


Input:

My farm has low rainfall and biodiversity is decreasing



Output:


Environmental Assessment

Recommendations

Scientific Reasoning

Environmental Metrics

Expected Timeline

Evidence Sources



---

# 🛠️ Local Development Setup


## Requirements


- Node.js 20+
- Python 3.11+
- MongoDB
- Azure OpenAI Account


---

# 1. Clone Repository


```bash
git clone <repository-url>

cd eco-scientist-ai

2. Backend Setup
cd backend

npm install

Create:

backend/.env

Add:

PORT=5000

MONGO_URI=

AI_SERVICE_URL=http://localhost:8000

Run:

npm run dev

Backend runs:

http://localhost:5000
3. AI Service Setup
cd ai-service

Create virtual environment:

python -m venv venv

Activate:

Windows:

venv\Scripts\activate

Install:

pip install -r requirements.txt

Create:

ai-service/.env

Add:

AZURE_OPENAI_API_KEY=

AZURE_OPENAI_ENDPOINT=

AZURE_OPENAI_DEPLOYMENT=

AZURE_OPENAI_API_VERSION=

Run:

uvicorn app:app --reload --port 8000

AI Service:

http://localhost:8000
4. Frontend Setup
cd frontend

npm install

Create:

frontend/.env

Add:

VITE_API_URL=http://localhost:5000

Run:

npm run dev
🔌 API Flow
Frontend

POST /api/chat/stream


        ↓


Node Backend

localhost:5000


        ↓


FastAPI AI Service

localhost:8000


        ↓


Azure GPT

🧠 RAG Knowledge Base

Current knowledge sources:

knowledge/

01_soil_health.md

02_biodiversity.md

03_climate.md

04_agroforestry.md

05_land_use.md

📊 Performance

Current optimized pipeline:

Retrieval:
20-40 ms


LLM Response:
5-10 seconds


Streaming:
Enabled

🔐 Environment Security

Never commit:

.env

node_modules/

venv/

vector_db/


Use:

.env.example

for sharing configuration.

📝 Git Commit Convention

Feature:

feat: add feature

Bug Fix:

fix: resolve issue

Performance:

perf: improve latency

Documentation:

docs: update documentation
📌 Current Version
v0.1.0

Initial AI backend + RAG architecture
Future Roadmap
React AI Chat Interface
Authentication UI
User Dashboard
Farm Data Upload
Environmental Reports
Advanced AI Agents
Production Deployment