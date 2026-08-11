# HealthMate AI — Multi-Agent Healthcare Assistant

A multi-agent healthcare assistant built on **Microsoft Azure AI Foundry** and the
**Azure AI Agents SDK**. A Coordinator Agent routes each user request to the
right specialist agents (Triage, Medical Information, Specialist
Recommendation, Lifestyle, Appointment, Medical Report), and a Summary Agent
combines their outputs into one structured response.

> ⚠️ Educational tool only. HealthMate AI never diagnoses conditions or
> prescribes medication. Always consult a qualified healthcare professional.

---

## 1. Architecture

```
React Frontend (Vite + Tailwind + shadcn/ui)
        │  Axios / fetch (streaming)
        ▼
FastAPI Backend  (/chat, /upload, /history, /health)
        │
        ▼
Coordinator Agent  (Azure AI Agents SDK) ── decides routing only
        │
        ├── Triage Agent
        ├── Medical Information Agent
        ├── Specialist Recommendation Agent
        ├── Lifestyle Agent
        ├── Appointment Agent (mock data today)
        └── Medical Report Agent (PDF/DOCX/TXT)
        │
        ▼
Summary Agent  ── combines everything into the final response
        │
        ▼
Frontend renders structured answer + live agent trace
```

Each specialist is a **real Azure AI Agent** (created via
`agents_client.create_agent(...)`), not a prompt-template shim. Each request
gets its own thread; agents are cached per process so they aren't
re-created on every call.

## 2. Folder Structure

```
healthmate-ai/
  backend/
    app/
      agents/          # one file per specialist agent + base.py
      services/        # azure_client.py, orchestrator.py, conversation_store.py
      routers/         # chat.py, upload.py, history.py
      models/          # schemas.py (Pydantic)
      config.py
      main.py
    requirements.txt
    .env.example
  frontend/            # React + Vite (added in the next build pass)
  README.md
```

---

## 3. Setting Up Azure AI Foundry (step by step)

### Step 1 — Create an Azure AI Foundry resource
1. Go to **https://ai.azure.com** and sign in with your Azure account.
2. Click **Create new** → **AI Foundry resource** (this provisions an Azure AI
   Services / Foundry account in your subscription and resource group).
3. Choose a region that has GPT-4.1 / GPT-4.1-mini capacity (e.g. East US 2,
   Sweden Central — check current availability in the portal).

### Step 2 — Create a Project inside Foundry
1. Inside your new Foundry resource, click **+ New project**.
2. Give it a name, e.g. `healthmate-ai`.
3. Once created, open **Project overview** → copy the **project endpoint**
   (looks like `https://<resource>.services.ai.azure.com/api/projects/<project-name>`).
   This is your `AZURE_PROJECT_CONNECTION_STRING`.

### Step 3 — Deploy a model
1. In the project, go to **Models + endpoints** → **Deploy model**.
2. Choose **gpt-4.1-mini** (cheaper, fast — good default) or **gpt-4.1**.
3. Name the deployment (this name is what you put in `AZURE_OPENAI_MODEL`,
   e.g. `gpt-4.1-mini`).
4. Copy the **Azure OpenAI endpoint** and a **key** from the deployment's
   details page if you plan to call Azure OpenAI directly for anything
   outside the Agents SDK.

### Step 4 — Grant yourself/the app access (RBAC)
The Agents SDK authenticates with `DefaultAzureCredential`, which will use:
- Your `az login` identity locally, or
- A **Managed Identity** once deployed to Azure App Service.

Either way, assign the **Azure AI Developer** (or **Cognitive Services
User** at minimum) role on the Foundry resource:
```bash
az role assignment create \
  --assignee <your-user-or-managed-identity-object-id> \
  --role "Azure AI Developer" \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<foundry-resource-name>
```

### Step 5 — Install the SDKs
```bash
pip install azure-ai-projects azure-ai-agents azure-identity
```

### Step 6 — Configure environment variables
Copy `.env.example` to `.env` in `backend/` and fill in:
```
AZURE_PROJECT_CONNECTION_STRING=https://<resource>.services.ai.azure.com/api/projects/<project-name>
AZURE_OPENAI_MODEL=gpt-4.1-mini
```
(You do not need `AZURE_OPENAI_KEY` for the Agents SDK path — auth is via
`DefaultAzureCredential`. Keep it only if you add direct Azure OpenAI calls,
e.g. for embeddings/RAG.)

### Step 7 — Log in locally so DefaultAzureCredential works
```bash
az login
```

### Step 8 — Run the backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Visit `http://localhost:8000/health` — you should see `{"status": "ok", ...}`.
Visit `http://localhost:8000/docs` for interactive Swagger UI to test
`/chat` and `/upload` directly.

### Step 9 (optional) — Azure AI Search for RAG
If you want the Medical Information Agent to ground answers in a curated
knowledge base instead of the model's own knowledge:
1. Create an **Azure AI Search** resource, create an index of trusted
   medical reference content.
2. Fill `AZURE_AI_SEARCH_ENDPOINT` / `AZURE_AI_SEARCH_KEY` / index name in `.env`.
3. Attach an `AzureAISearchTool` to the Medical Information Agent's `tools=[]`
   list in `agents/medical.py` (see Azure AI Agents SDK docs for the exact
   tool definition — the SDK evolves quickly, check current syntax before
   wiring this in).

### Step 10 — Deploy
- **Backend** → Azure App Service (Linux, Python 3.12 runtime). Enable a
  **system-assigned Managed Identity** on the App Service and grant it the
  same "Azure AI Developer" role from Step 4 — this replaces `az login` in
  production.
- **Frontend** → Azure Static Web Apps, pointed at the deployed backend URL.

---

## 4. Running Locally (quick reference)

```bash
# Backend
cd backend
pip install -r requirements.txt
az login
cp .env.example .env   # then edit .env
uvicorn app.main:app --reload --port 8000

# Frontend (in a second terminal)
cd frontend
npm install
cp .env.example .env   # defaults to http://localhost:8000, edit if your backend runs elsewhere
npm run dev
```
Visit `http://localhost:5173` — the sidebar has Home, Chat, Medical Report Upload, History,
About, and Settings. The Home page shows a live "Backend connected / not reachable" indicator.

### Frontend structure
```
frontend/src/
  components/
    layout/      # Sidebar, MobileNav, AppShell
    chat/        # MessageBubble, AgentPipeline (live agent trace), ChatInput, MarkdownMessage
    common/      # Disclaimer, EmptyState
  pages/         # Home, Chat, Upload, History, About, Settings
  context/       # ThemeContext (dark mode)
  lib/           # api.ts (axios client), utils.ts
  types/         # api.ts — mirrors the backend's Pydantic schemas exactly
```
The Chat page shows a live agent-trace pipeline as each agent runs — pulsing amber while
executing, teal check when done, rose X if an agent fails — matching the real `agent_trace`
array returned by `/chat`.

## 5. API Endpoints

| Method | Path         | Purpose                                   |
|--------|--------------|--------------------------------------------|
| POST   | `/chat`      | Run the full multi-agent pipeline          |
| POST   | `/upload`    | Upload & summarize a medical report        |
| GET    | `/history`   | List all conversations                     |
| GET    | `/history/{id}` | Get one conversation                   |
| GET    | `/health`    | Health check                               |

## 6. Environment Variables

See `backend/.env.example` for the full list, including optional Azure AI
Search, Blob Storage, and Document Intelligence variables for stretch
features.

## 7. Future Improvements

- React frontend (chat UI, live agent trace, report upload, history, settings)
- Cosmos DB / Azure SQL swap for `ConversationStore`
- Real scheduling API behind `SchedulingProvider`
- Streaming token-by-token responses from each agent to the frontend
- Azure Entra ID authentication
- Voice input/output, PDF export of conversations
- Token usage & latency dashboard (the `agent_trace` field in `/chat`
  responses already carries per-agent latency — a dashboard just needs to
  visualize it)

## 8. License

MIT — for demonstration/educational purposes. Not a certified medical device.
