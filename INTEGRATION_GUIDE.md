# 🔄 Backend-Frontend Integration Guide

This guide explains how the Python backend integrates with your Next.js frontend in EchoChat.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    (localhost:3000 in iframe)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                              │
│                     (Port 3000)                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Pages & Components:                                      │  │
│  │  • src/app/page.tsx (Homepage)                           │  │
│  │  • src/app/dashboard/page.tsx                            │  │
│  │  • src/app/chat/page.tsx                                 │  │
│  │  • Upload forms, chat interface                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            │ fetch('/api/...')                   │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js API Routes (Middleware Layer):                  │  │
│  │  • /api/datasets/upload                                   │  │
│  │  • /api/datasets/[id]/validate                           │  │
│  │  • /api/datasets/[id]/train                              │  │
│  │  • /api/chat                                             │  │
│  │  • /api/training-jobs/[id]                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            │ Database Operations (Drizzle ORM)   │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database (Turso):                                        │  │
│  │  • datasets table                                         │  │
│  │  • training_jobs table                                    │  │
│  │  • workspaces table                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ fetch('http://localhost:8000/...')
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PYTHON FASTAPI BACKEND                        │
│                     (Port 8000)                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Endpoints:                                               │  │
│  │  • POST /datasets/validate                                │  │
│  │  • POST /train                                            │  │
│  │  • POST /chat                                             │  │
│  │  • GET /health                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services:                                                │  │
│  │  • Dataset validation (CSV/JSON/Rasa)                    │  │
│  │  • Model training orchestration                          │  │
│  │  • NLU inference                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RASA NLU SERVER                             │
│                     (Port 5005 - Optional)                       │
│  • Trained NLU models                                            │
│  • Intent classification                                         │
│  • Entity extraction                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. **Dataset Upload Flow**

**User Action**: Upload CSV/JSON/Rasa file

```typescript
// Frontend Component (src/app/dashboard/page.tsx)
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // ① Call Next.js API
  const response = await fetch('/api/datasets/upload', {
    method: 'POST',
    body: formData,
  });
};
```

```typescript
// Next.js API Route (src/app/api/datasets/upload/route.ts)
export async function POST(request: NextRequest) {
  // ② Save file to disk
  await writeFile(filepath, buffer);
  
  // ③ Create database record
  const dataset = await db.insert(datasets).values({...});
  
  // ④ Trigger validation (non-blocking)
  fetch('/api/datasets/{id}/validate', { method: 'POST' });
  
  return NextResponse.json({ dataset });
}
```

```typescript
// Next.js Validation Route (src/app/api/datasets/[id]/validate/route.ts)
export async function POST(request: NextRequest) {
  // ⑤ Call Python backend
  const pythonResponse = await fetch('http://localhost:8000/datasets/validate', {
    method: 'POST',
    body: JSON.stringify({ dataset_id, file_path, format })
  });
  
  // ⑥ Update database with results
  await db.update(datasets).set({ status: 'validated', ... });
}
```

```python
# Python Backend (python-rasa-backend/app.py)
@app.post("/datasets/validate")
async def validate_dataset(request: DatasetValidationRequest):
    # ⑦ Parse and validate file
    if format == 'csv':
        result = validate_csv_format(file_path)
    
    # ⑧ Extract intents, entities, sample count
    return DatasetValidationResponse(
        valid=True,
        intents=['greet', 'book_flight'],
        entities=['city', 'date'],
        sample_count=150
    )
```

---

### 2. **Model Training Flow**

**User Action**: Click "Train Model" button

```typescript
// Frontend Component
const handleTrain = async (datasetId: number) => {
  // ① Call Next.js API
  const response = await fetch(`/api/datasets/${datasetId}/train`, {
    method: 'POST'
  });
  
  const { training_job } = await response.json();
  
  // ② Poll for training status
  const interval = setInterval(async () => {
    const status = await fetch(`/api/training-jobs/${training_job.id}`);
    const job = await status.json();
    
    if (job.status === 'completed') {
      clearInterval(interval);
      // Show success message
    }
  }, 2000);
};
```

```typescript
// Next.js Train Route (src/app/api/datasets/[id]/train/route.ts)
export async function POST(request: NextRequest) {
  // ③ Create training job record
  const trainingJob = await db.insert(trainingJobs).values({
    status: 'queued',
    ...
  });
  
  // ④ Call Python backend (non-blocking)
  fetch('http://localhost:8000/train', {
    method: 'POST',
    body: JSON.stringify({
      training_job_id: trainingJob.id,
      dataset_id,
      file_path,
      format
    })
  });
  
  return NextResponse.json({ training_job });
}
```

```python
# Python Backend
@app.post("/train")
async def train_model(request: TrainingRequest, background_tasks: BackgroundTasks):
    # ⑤ Start training in background
    background_tasks.add_task(train_model_task, ...)
    
    return {"message": "Training started"}

async def train_model_task(training_job_id, file_path, format):
    # ⑥ Update Next.js with progress
    async with aiohttp.ClientSession() as session:
        await session.patch(
            f"{NEXT_API_URL}/training-jobs/{training_job_id}",
            json={"status": "training", "progress": 0.5}
        )
    
    # ⑦ Run Rasa training
    # ... actual training logic ...
    
    # ⑧ Update Next.js when complete
    await session.patch(
        f"{NEXT_API_URL}/training-jobs/{training_job_id}",
        json={"status": "completed", "model_path": "..."}
    )
```

---

### 3. **Chat/Testing Flow**

**User Action**: Send message in chat interface

```typescript
// Frontend Chat Component (src/app/chat/page.tsx)
const handleSendMessage = async (message: string) => {
  // ① Call Next.js chat API
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      sender: 'user_123'
    })
  });
  
  const replies = await response.json();
  // ② Display bot responses
  setMessages([...messages, ...replies]);
};
```

```typescript
// Next.js Chat Route (src/app/api/chat/route.ts)
export async function POST(request: NextRequest) {
  const { message, sender } = await request.json();
  
  // ③ Try Rasa first (via Python backend)
  try {
    const rasaResponse = await fetch('http://localhost:5005/webhooks/rest/webhook', {
      method: 'POST',
      body: JSON.stringify({ sender, message })
    });
    
    if (rasaResponse.ok) {
      return NextResponse.json(await rasaResponse.json());
    }
  } catch {
    // ④ Fallback to built-in AI
    const fallbackResponse = await fallbackAI.processMessage(message);
    return NextResponse.json(fallbackResponse);
  }
}
```

---

## Running Both Servers

### Option 1: Manual Start (Development)

**Terminal 1 - Next.js Frontend:**
```bash
bun run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Python Backend:**
```bash
cd python-rasa-backend
chmod +x start.sh
./start.sh
# Runs on http://localhost:8000
```

**Terminal 3 - Rasa Server (Optional):**
```bash
cd python-rasa-backend/rasa
rasa run --enable-api --cors "*" --port 5005
# Runs on http://localhost:5005
```

### Option 2: Docker Compose (Production)

```bash
docker-compose up -d
```

---

## Environment Variables

### Next.js (.env)
```env
# Python Backend URL
PYTHON_BACKEND_URL=http://localhost:8000

# Database
TURSO_CONNECTION_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Python Backend (python-rasa-backend/.env)
```env
# Next.js API URL (for callbacks)
NEXT_API_URL=http://localhost:3000/api

# Rasa Server
RASA_URL=http://localhost:5005

# Server Port
PORT=8000
```

---

## API Communication Patterns

### Pattern 1: Request-Response (Synchronous)
Used for: Dataset validation, health checks

```
Frontend → Next.js API → Python Backend → Response → Next.js → Frontend
```

### Pattern 2: Fire-and-Forget (Asynchronous)
Used for: Training jobs

```
Frontend → Next.js API → Python Backend (starts background task)
                      ↓
                 Returns immediately
                      
Python Backend → Periodically updates Next.js API → Database
Frontend → Polls Next.js API for status updates
```

### Pattern 3: Fallback Chain
Used for: Chat/NLU inference

```
Frontend → Next.js API → Try Rasa (via Python)
                       ↓ (if fails)
                    Fallback AI in Next.js
```

---

## Testing the Integration

### 1. Test Python Backend
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "rasa_status": "disconnected"}
```

### 2. Test Dataset Validation
```bash
curl -X POST http://localhost:8000/datasets/validate \
  -H "Content-Type: application/json" \
  -d '{"dataset_id": 1, "file_path": "/uploads/test.csv", "format": "csv"}'
```

### 3. Test Full Flow
1. Open http://localhost:3000
2. Sign in / Create account
3. Upload a CSV dataset
4. Watch validation happen automatically
5. Click "Train Model"
6. Monitor training progress
7. Test chat interface

---

## Common Issues & Solutions

### Issue: Python backend not reachable
```
Solution: Check PYTHON_BACKEND_URL in Next.js .env
Verify: curl http://localhost:8000/health
```

### Issue: Training jobs stuck in "queued"
```
Solution: Check Python backend logs
Verify: Python backend is running and can reach Next.js API
```

### Issue: Chat not working
```
Solution: Rasa is optional - fallback AI should work
Verify: Check /api/chat route returns responses
```

---

## Next Steps

1. ✅ Start both servers (Next.js + Python)
2. ✅ Test dataset upload and validation
3. ✅ Test model training flow
4. ✅ Test chat interface
5. 🔄 Set up Rasa for production NLU (optional)
6. 🔄 Add authentication to Python API routes
7. 🔄 Deploy both services

---

## File Structure Reference

```
your-project/
├── src/                           # Next.js Frontend
│   ├── app/
│   │   ├── api/                  # Next.js API Routes (Port 3000)
│   │   │   ├── datasets/
│   │   │   │   ├── upload/route.ts         → Saves files, creates DB records
│   │   │   │   └── [id]/
│   │   │   │       ├── validate/route.ts   → Calls Python for validation
│   │   │   │       └── train/route.ts      → Calls Python for training
│   │   │   ├── training-jobs/
│   │   │   │   └── [id]/route.ts           → Status updates from Python
│   │   │   └── chat/route.ts               → Chat interface
│   │   ├── dashboard/page.tsx    # Upload UI
│   │   ├── chat/page.tsx         # Chat UI
│   │   └── page.tsx              # Homepage
│   └── db/                       # Database schema & connection
│
└── python-rasa-backend/          # Python Backend
    ├── app.py                    # FastAPI server (Port 8000)
    ├── requirements.txt          # Python dependencies
    ├── start.sh                  # Startup script
    └── rasa/                     # Rasa NLU (Port 5005)
        ├── data/
        ├── models/
        └── config.yml
```

This integration allows seamless communication between your Next.js frontend and Python backend for NLU training! 🚀
