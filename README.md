# HealthMate AI

A multi-agent healthcare assistant built on Microsoft Azure AI Foundry. Describe your symptoms once and instead of one model trying to be a triage nurse, a diagnostician, a nutritionist and a receptionist all at the same time, a coordinator routes your question to a set of narrowly-scoped specialist agents and stitches their answers into one response.

This is a personal/portfolio project, not a certified medical product. It's meant to demonstrate a real multi-agent architecture on Azure — actual agents, actual threads, actual orchestration — rather than a single system prompt pretending to be several personas.


<img width="960" height="433" alt="3" src="https://github.com/user-attachments/assets/d434cae6-48e0-4377-8b9f-d2f51457405b" />
<img width="943" height="436" alt="6" src="https://github.com/user-attachments/assets/940f84ca-c2d8-48fe-b7b6-1a43004e2b97" />
<img width="958" height="447" alt="7" src="https://github.com/user-attachments/assets/3030a0fe-2334-4e04-bf6f-290cf347488a" />
<img width="959" height="443" alt="8" src="https://github.com/user-attachments/assets/1feda83f-5650-45ba-bff2-2b486959bc7b" />
<img width="960" height="416" alt="1" src="https://github.com/user-attachments/assets/0bf7fa82-5ff1-478d-8b42-a9854e5bcfd3" />
<img width="940" height="382" alt="2" src="https://github.com/user-attachments/assets/d9a37fc9-b78b-42f1-9979-da8881de0748" />
<img width="941" height="442" alt="4" src="https://github.com/user-attachments/assets/0b8dfe1f-160b-4f20-9daf-028dfeb0e3a3" />


---

## The problem this is solving

Most "AI health chatbots" are a single LLM call with a long system prompt bolted on. That works fine for simple Q&A, but it breaks down in a few predictable ways:

- **Scope creep.** One prompt asked to triage, educate, recommend specialists, give lifestyle advice, and summarize reports tends to blur the lines between those jobs — you'll get a triage answer that quietly slides into giving treatment advice it shouldn't.
- **No separation of safety boundaries.** If "never diagnose" and "never prescribe" are just two lines buried in a 2,000-word prompt, they're easy for the model to lose track of once the conversation has enough other instructions competing for attention.
- **No visibility.** You can't tell *why* the assistant said what it said, or which part of the answer came from where, which matters a lot more in a health context than in a general chatbot.

The bet this project makes is that splitting those responsibilities into separate agents — each with a tight, single-purpose system prompt and its own execution trace — produces more consistent, more auditable behavior than one agent trying to do everything at once.

## The approach

A **Coordinator Agent** reads the incoming message and decides which specialists are actually relevant (a question about a rash doesn't need the Appointment Agent involved; a question about "which doctor should I see" doesn't need the full symptom triage flow). It never answers medical questions itself — its only job is routing.

The specialists it can route to:

| Agent | Job | Explicitly forbidden from |
|---|---|---|
| Triage | Classifies urgency (Emergency / Urgent / Routine / Home Care) | Diagnosing a condition |
| Medical Information | Explains symptoms, conditions, tests, prevention | Prescribing treatment |
| Specialist Recommendation | Points to the right *type* of doctor from a fixed list | Naming a specific disease |
| Lifestyle | Diet, sleep, hydration, exercise guidance | Recommending supplements or medication |
| Appointment | Surfaces mock doctor/slot data, prep questions | Actually booking anything (no real scheduling API yet) |
| Medical Report | Summarizes an uploaded PDF/DOCX/TXT, flags values worth a second look | Diagnosing based on the report |

Once the relevant specialists have run (in parallel where possible, since most of them don't depend on each other), a **Summary Agent** takes their raw output and combines it into one structured response — urgency, education, lifestyle notes, specialist recommendation, appointment info, and a single safety disclaimer at the end instead of six repeated ones.

Each specialist is a real Azure AI Agent, created through the Azure AI Agents SDK (`create_agent`), run against its own thread per request. This wasn't the easiest path — the SDK's API surface has shifted meaningfully across recent beta versions (the constructor signature for the project client, the method names on the agents client, even whether `AIProjectClient.agents` gives you the full client or a slimmer operations object have all changed between releases) — but it was worth it over faking multi-agent behavior with prompt templates, which was an explicit non-goal for this build.

## Why this stack

- **FastAPI over Flask/Django** — async support out of the box, which matters when you're firing off several agent calls per request and want to run the independent ones concurrently instead of serially.
- **Pydantic models mirrored on both sides** — the TypeScript types in the frontend are a direct mirror of the backend's Pydantic schemas, so the contract between them is explicit rather than inferred from whatever JSON happens to come back.
- **JSON file for conversation storage, not a database** — this is a local/demo project. The storage layer is written behind a `ConversationStore` interface specifically so swapping in Cosmos DB or Azure SQL later is a one-file change, not a rewrite.
- **Mock data for appointments** — same reasoning. There's no real scheduling backend to integrate with here, so the `SchedulingProvider` interface exists so a real one can be dropped in without touching the agent's prompt or output format.
- **React + Vite + Tailwind, no component library dependency** — the UI is hand-built rather than assembled from a kit, partly because a generic admin-dashboard template doesn't fit a symptom-checker use case well, and partly because the live agent-execution trace (the pipeline view that lights up as each agent completes) isn't something an off-the-shelf kit gives you.

## Architecture

```
                    ┌─────────────────────┐
                    │   React Frontend     │
                    │  (Vite + Tailwind)   │
                    └──────────┬───────────┘
                               │ REST (axios)
                    ┌──────────▼───────────┐
                    │   FastAPI Backend     │
                    │  /chat /upload /hist  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Coordinator Agent   │  (routing only, never answers)
                    └──────────┬───────────┘
                               │
        ┌──────────┬──────────┼──────────┬──────────┬──────────┐
        ▼          ▼          ▼          ▼          ▼          ▼
    Triage     Medical    Specialist  Lifestyle  Appointment  Report
                Info      Rec.
        │          │          │          │          │          │
        └──────────┴──────────┴──────────┴──────────┴──────────┘
                               │
                    ┌──────────▼───────────┐
                    │    Summary Agent      │  (combines everything)
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Structured response  │
                    └───────────────────────┘
```

Each specialist agent is created via `azure.ai.agents.AgentsClient.create_agent()`, authenticated through `DefaultAzureCredential` (Entra ID — either your `az login` session locally, or a Managed Identity once deployed, no API keys involved).

## Tech stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Axios, react-markdown, lucide-react

**Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2, python-dotenv

**Azure:** Azure AI Foundry, Azure AI Agents SDK, Azure OpenAI (GPT-5-mini deployment), Microsoft Entra ID auth

**File processing:** pypdf, python-docx (for the Medical Report Agent)

## Project structure

```
healthmate-ai/
├── backend/
│   ├── app/
│   │   ├── agents/            # one file per specialist, each with its own system prompt
│   │   ├── services/          # azure_client.py, orchestrator.py, conversation_store.py
│   │   ├── routers/           # chat.py, upload.py, history.py
│   │   ├── models/            # schemas.py — every API type lives here
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── layout/        # Sidebar, MobileNav, AppShell
│       │   ├── chat/          # MessageBubble, AgentPipeline, ChatInput, MarkdownMessage
│       │   └── common/        # Disclaimer, EmptyState
│       ├── pages/              # Home, Chat, Upload, History, About
│       ├── lib/                 # api.ts, utils.ts
│       └── types/               # api.ts — mirrors backend Pydantic schemas
├── start.ps1 / start.sh        # single-command launcher for both servers
└── README.md
```

## Getting started

### Prerequisites
- Python 3.11+
- Node.js 18+
- An Azure subscription with access to Azure AI Foundry
- Azure CLI (`az`) installed and authenticated

### 1. Set up Azure AI Foundry
1. Create an AI Foundry resource and a project inside it at [ai.azure.com](https://ai.azure.com).
2. Deploy a model — this project was built and tested against **gpt-5-mini** (GPT-4.1-mini is deprecated as of mid-2026; avoid it).
3. Copy the project's endpoint URL — it looks like `https://<resource>.services.ai.azure.com/api/projects/<project-name>`.
4. Confirm your account has at least the **Azure AI Developer** role on the resource (Owner covers this automatically).

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
az login
cp .env.example .env
# edit .env — set AZURE_PROJECT_CONNECTION_STRING and AZURE_OPENAI_MODEL
uvicorn app.main:app --reload --port 8000
```
Visit `http://localhost:8000/docs` to confirm it's running and to test `/chat` directly.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Visit `http://localhost:5173`.

### 4. Or run both at once
```bash
./start.ps1   # Windows
./start.sh    # macOS/Linux
```

## Configuration

All config lives in `backend/.env`. The only two values that actually matter for the app to function:

```
AZURE_PROJECT_CONNECTION_STRING=https://<resource>.services.ai.azure.com/api/projects/<project>
AZURE_OPENAI_MODEL=gpt-5-mini
```

Authentication is handled entirely by `DefaultAzureCredential` — there's no API key in this flow. `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_KEY` are present in `.env.example` for future use (e.g. if direct embedding calls get added for a RAG feature) but nothing in the current codebase reads them.

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/chat` | Runs the full pipeline: coordinator → specialists → summary |
| `POST` | `/upload` | Accepts a PDF/DOCX/TXT report, returns a structured summary |
| `GET` | `/history` | Lists saved conversations |
| `GET` | `/history/{id}` | Returns one conversation's full turn history |
| `GET` | `/health` | Basic liveness check |

## Known limitations

- Conversation storage is a flat JSON file — fine for local use, not for concurrent multi-user production traffic.
- Appointment data is fully mocked; there's no real scheduling backend wired in yet.
- The chat UI shows a generic "pending" pipeline while waiting on the backend rather than true token-level streaming, since `/chat` currently returns one complete response rather than a stream. Real streaming would need the backend to emit agent completions as they happen (e.g. over SSE or websockets) instead of waiting for the whole orchestration to finish.
- No authentication layer yet — anyone with the URL can use the app as-is. Fine for local/demo use, not for a public deployment.

## Roadmap

- Swap the JSON conversation store for Cosmos DB
- Real streaming of agent progress instead of a simulated pending state
- A real scheduling API behind the `SchedulingProvider` interface
- Microsoft Entra ID login for the app itself
- Azure AI Search-backed RAG for the Medical Information Agent, so its answers are grounded in a curated source set rather than the model's general knowledge

## A note on safety

HealthMate AI does not diagnose conditions and does not prescribe medication or dosages, by design — every specialist agent's system prompt explicitly forbids it, and the Summary Agent appends a single safety disclaimer to every response. This project is for educational and portfolio purposes. It is not a substitute for professional medical advice, and if you're dealing with a real medical emergency, it will tell you to contact emergency services rather than try to help further.

## License

MIT.
