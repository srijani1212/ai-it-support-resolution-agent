# AI IT Support Resolution Agent (POC)

A complete working Proof-of-Concept (POC) for an **AI-powered IT Support Resolution Agent** using **LangGraph**, **Groq Llama 3.3 70B**, **FastAPI / Express**, and a simulated **In-Memory Mutable IT Environment**.

---

## 🌟 Overview & Purpose

This POC simulates an enterprise IT support resolution agent that remediates common workplace IT incidents without hardcoded troubleshooting trees. The LLM uses genuine **tool/function calling** in an autonomous LangGraph loop to inspect state, perform remediation, verify outcomes, and resolve or safely escalate tickets.

### Supported Issue Scenarios
1. **VPN Connectivity Issues**
   - Disconnected VPN with valid certificate $\rightarrow$ Automated restart $\rightarrow$ Verification $\rightarrow$ `RESOLVED`.
   - Disconnected VPN with expired/invalid machine certificate $\rightarrow$ No certificate repair tool $\rightarrow$ Safe `ESCALATE` to PKI & Network Operations.
2. **Expired / Locked Credentials**
   - Expired password causing login failure $\rightarrow$ Agent detects expired state $\rightarrow$ Executes password reset $\rightarrow$ Verifies `active` state $\rightarrow$ Subsequent login succeeds $\rightarrow$ `RESOLVED`.
3. **Unsupported IT Requests**
   - E.g., SAP license key requests $\rightarrow$ Mock RAG returns no matching SOP $\rightarrow$ Immediate safe `ESCALATE` to Tier 2.

---

## 🏗️ Architecture & Operational Flow

```
+------------------+
|  Employee Ticket |
+--------+---------+
         |
         v
+------------------+
|     Mock RAG     |  --> SOP-VPN-01..05 / SOP-AUTH-01..04
+--------+---------+
         |
         v
+------------------------------------------------------+
|             LangGraph State Machine                  |
|                                                      |
|   +-------------------+      Tool Call Request       |
|   |  Groq LLM         | ------------------------+    |
|   |  (Llama 3.3 70B)  |                         |    |
|   +-------------------+ <--------------------+  |    |
|            |             Tool Execution Res  |  |    |
|            |                                 |  |    |
|            |                                 v  v    |
|            |                       +---------------+ |
|            |                       | Execution     | |
|            |                       | Node          | |
|            |                       +-------+-------+ |
|            |                               |         |
|            | State Verification            | Mutates |
|            v                               v         |
|   +-------------------+          +-----------------+ |
|   | Final Evaluation  |          | In-Memory Mock  | |
|   | RESOLVED/ESCALATE |          | Environment     | |
|   +-------------------+          +-----------------+ |
+------------------------------------------------------+
```

### Safety & Guardrails
- **Max Step Protection:** Capped at 6 troubleshooting steps to prevent infinite looping.
- **Verification Integrity:** Never claims `RESOLVED` without a secondary check tool proving the state mutation.
- **Zero Real System Impact:** Complete in-memory simulation; never touches real Active Directory, Kerberos, or VPN gateways.

---

## 📁 Project Structure

```
it-support-agent/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point & CORS
│   │   ├── api/                 # REST API routes (/tickets, /login, /environment)
│   │   │   ├── __init__.py
│   │   │   └── routes.py
│   │   ├── agent/               # LangGraph state machine & nodes
│   │   │   ├── __init__.py
│   │   │   ├── state.py         # AgentState TypedDict
│   │   │   ├── nodes.py         # RAG, LLM Reasoning, Tool Execution nodes
│   │   │   └── graph.py         # StateGraph builder and compiled runner
│   │   ├── tools/               # In-memory mock IT environment & tools
│   │   │   ├── __init__.py
│   │   │   ├── mock_env.py      # MockITEnvironment class
│   │   │   ├── vpn_tools.py     # check_vpn_status, restart_vpn, check_certificate
│   │   │   └── password_tools.py# check_password_status, reset_password, mock_login
│   │   ├── rag/                 # SOP Runbook Mock RAG retrieval
│   │   │   ├── __init__.py
│   │   │   └── mock_rag.py
│   │   ├── llm/                 # Groq Llama 3.3 70B client
│   │   │   ├── __init__.py
│   │   │   └── groq_client.py
│   │   └── models/              # Pydantic request/response schemas
│   │       ├── __init__.py
│   │       └── schemas.py
│   ├── tests/                   # 20 automated unit/integration tests
│   │   ├── __init__.py
│   │   ├── run_tests.py         # Standalone test runner
│   │   ├── test_vpn.py
│   │   ├── test_password.py
│   │   ├── test_agent.py
│   │   ├── test_env.py
│   │   └── test_api.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # React dashboard modular panels
│   │   │   ├── EnvironmentPanel.tsx
│   │   │   ├── LoginPanel.tsx
│   │   │   ├── TicketPanel.tsx
│   │   │   ├── RagKnowledgePanel.tsx
│   │   │   ├── AgentActivityPanel.tsx
│   │   │   ├── FinalResultPanel.tsx
│   │   │   ├── TestRunnerModal.tsx
│   │   │   └── ArchitectureModal.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
├── README.md
├── .gitignore
└── docker-compose.yml
```

---

## ⚙️ Environment Variables

Create `.env` based on `.env.example`:

```env
# Groq API Key (Optional for offline mock mode, required for live LLaMA 3.3 70B)
GROQ_API_KEY="your_groq_api_key_here"
GROQ_MODEL="llama-3.3-70b-versatile"
PORT=3000
```

---

## 🚀 Setup & Execution

### Option 1: Full-Stack Vite + Express Server (Current AI Studio Container)
```bash
# 1. Install dependencies
npm install

# 2. Run dev server (Binds to 0.0.0.0:3000)
npm run dev

# 3. Build production bundle
npm run build
npm start
```

### Option 2: Python Backend Standalone
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```

### Option 3: Docker Compose
```bash
docker-compose up --build
```

---

## 🧪 Automated Tests (20 Tests)

To execute all tests:
```bash
python3 backend/tests/run_tests.py
# or using pytest:
pytest backend/tests
```

### Tested Capabilities:
- `test_vpn_success_agent_resolution`: VPN disconnection remediation & verification.
- `test_vpn_escalation_when_certificate_invalid`: Safe escalation on bad certificate.
- `test_login_fails_before_password_reset`: Proves login failure when password expired.
- `test_login_succeeds_after_password_reset`: Proves login succeeds after password reset.
- `test_unsupported_issue_escalates_immediately`: Safe escalation for unsupported tickets.
- `test_maximum_step_protection`: Enforces 6-step upper bound.
- `test_invalid_tool_response_and_execution_guard`: Safeguards against hallucinated tools.
- `test_mock_environment_state_transitions`: In-memory state persistence and resets.

---

## 📡 API Specification

### 1. Submit Ticket for AI Resolution
`POST /tickets` (or `POST /api/tickets`)

**Request Body:**
```json
{
  "ticket": "My corporate VPN is disconnected and won't connect"
}
```

**Response Body (`AgentResponse`):**
```json
{
  "status": "RESOLVED",
  "resolution": "VPN service successfully restarted and tunnel connection verified active.",
  "actions_taken": ["check_vpn_status", "restart_vpn", "check_vpn_status"],
  "reason": "All troubleshooting actions executed and post-remediation state verified.",
  "events": [
    { "step": 1, "event_type": "ticket_received", "description": "Ticket received: ..." },
    { "step": 2, "event_type": "rag_retrieved", "description": "RAG retrieved 5 SOP knowledge rules..." },
    { "step": 3, "event_type": "tool_selected", "description": "Agent selected tool: check_vpn_status()" },
    { "step": 4, "event_type": "tool_result", "description": "Tool result for check_vpn_status: disconnected" },
    { "step": 5, "event_type": "tool_selected", "description": "Agent selected tool: restart_vpn()" },
    { "step": 6, "event_type": "tool_result", "description": "Tool result for restart_vpn: connected" },
    { "step": 7, "event_type": "tool_selected", "description": "Agent selected tool: check_vpn_status()" },
    { "step": 8, "event_type": "tool_result", "description": "Tool result for check_vpn_status: connected" },
    { "step": 9, "event_type": "verification", "description": "Verification successful: Target state confirmed in mock environment." },
    { "step": 10, "event_type": "resolved", "description": "Agent marked ticket as RESOLVED" }
  ]
}
```

### 2. Corporate Authentication
`POST /login` (or `POST /api/login`)

**Request Body:**
```json
{
  "username": "emp_1042",
  "password": "CorporatePassword2026!"
}
```

---

## 🔄 Replacing MockRAG with Enterprise Production RAG

To transition this POC to enterprise production:
1. Replace `MockRAG` in `backend/app/rag/mock_rag.py` with an implementation of `BaseRAG` utilizing a vector database (e.g. Pinecone, ChromaDB, pgvector with LangChain embeddings).
2. Connect embeddings generation model (e.g. `text-embedding-3-small` or `voyage-large-2`).
3. Replace `mock_env.py` and simulated tools in `backend/app/tools/` with real API connectors to Active Directory / Microsoft Entra ID (Graph API) and Cisco AnyConnect / Palo Alto GlobalProtect APIs with proper OAuth2 service principal tokens.
