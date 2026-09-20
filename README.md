# Eco Scientist AI

Eco Scientist AI is a full-stack environmental analysis assistant. It combines a
scientific document knowledge base with Azure OpenAI to produce evidence-backed
assessments for soil health, rainfall, biodiversity, climate stress, and land-use
problems.

## Architecture

```text
React + Vite frontend
        |
        | HTTP / Server-Sent Events
        v
Node.js + Express API ---- MongoDB
        |
        | HTTP / Server-Sent Events
        v
FastAPI AI service
        |
        +---- Azure OpenAI
        |
        +---- LangChain + Chroma + HuggingFace embeddings
                              |
                              v
                    Scientific PDF knowledge base
```

## Current features

### Web application

- Streaming chat interface with Markdown and tables
- Guest conversations backed by a browser session ID
- Signup, login, logout, and profile restoration
- HTTP-only JWT authentication
- Guest conversation migration after login or signup
- Conversation history, restoration, rename, and delete
- Automatic AI-generated conversation titles
- New-chat and stop-stream controls

### Backend API

- Authenticated and guest conversation ownership
- MongoDB persistence for users, messages, titles, and activity timestamps
- Normal and streaming AI-service proxies
- Server-Sent Events forwarding with stream buffering
- Recent-message conversation context
- Production-aware authentication cookies

### AI service

- Retrieval-Augmented Generation using Chroma
- `sentence-transformers/all-MiniLM-L6-v2` embeddings
- Azure OpenAI chat generation
- Normal and streaming response endpoints
- Multi-turn clarification that accumulates facts supplied by the user
- Structured environmental assessment, recommendations, metrics, timeline,
  confidence, and evidence sections
- Guardrails against invented sources and unsupported numerical claims

## Scientific knowledge base

The current `ai-service/knowledge/` directory contains:

- `fao_recarbonizing_soils_cases.pdf`
- `fao_recarbonizing_soils_practices.pdf`
- `fao_soil_resources.pdf`
- `ipcc_climate_impacts.pdf`
- `unccd_global_land_outlook.pdf`

The generated Chroma database is stored in `ai-service/vector_db/` and is ignored
by Git. Rebuild it whenever the knowledge documents or chunking settings change.

## Repository layout

```text
eco-scientist-ai/
|-- frontend/       React 19 and Vite user interface
|-- backend/        Express API, authentication, and MongoDB persistence
|-- ai-service/     FastAPI, Azure OpenAI, RAG, and scientific documents
`-- README.md
```

## Requirements

- Node.js 20 or newer
- Python 3.11 or newer
- MongoDB
- An Azure OpenAI deployment

## Configuration

Copy each example file to `.env` in the same directory and supply its values.

### `backend/.env`

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/eco-scientist
AI_SERVICE_URL=http://localhost:8001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=7d
NODE_ENV=development
```

### `ai-service/.env`

```dotenv
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_API_VERSION=
PORT=8001
HOST=127.0.0.1
AI_RELOAD=false
```

### `frontend/.env`

```dotenv
VITE_API_URL=http://localhost:5000
```

Never commit `.env`, `node_modules`, virtual environments, or generated vector
databases.

## Install and run

Open three terminals from the repository root.

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

The backend listens on `http://localhost:5000` by default.

### 2. AI service

```bash
cd ai-service
python -m venv venv
```

Activate the environment on Windows:

```powershell
venv\Scripts\Activate.ps1
```

Then install and start the service:

```bash
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

The AI service listens on `http://localhost:8001`. Its readiness endpoint is
`GET /health`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves the application at `http://localhost:5173` by default.

## Build the vector database

From `ai-service/` with the Python environment active:

```bash
python rag/indexer.py
```

Indexing the large PDFs can take time and requires enough local disk space and
memory for the embedding model.

## API summary

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/users/profile`
- `GET /api/users/me`

### Conversations

- `POST /api/chat/send`
- `POST /api/chat/stream`
- `GET /api/chat/session/:sessionId`
- `GET /api/chat/user`
- `GET /api/chat/conversation/:conversationId`
- `PATCH /api/chat/conversation/:conversationId/title`
- `DELETE /api/chat/conversation/:conversationId`
- `POST /api/chat/merge`

Authenticated ownership is derived from the verified JWT cookie. Guest requests
must include their `sessionId`; the API never accepts a client-supplied user ID as
proof of ownership.

## Tests and validation

Run the local automated checks with:

```bash
cd frontend
npm test
npm run lint
npm run build

cd ../backend
npm test

cd ../ai-service
python -m unittest discover -s tests -v
```

The older top-level Python `test_*.py` files are manual Azure/RAG smoke scripts.
They require configured Azure credentials and a generated vector database.

## Current scope

The application is a local-development MVP. MongoDB and Azure OpenAI remain
external runtime dependencies, so a full end-to-end run requires both services.
Production deployment, farm-data uploads, richer geospatial analysis, and formal
evaluation of model answers remain future work.
