# 🚀 EchoChat Setup Guide

## 📋 Quick Overview

**EchoChat** is an NLU chatbot training platform with:
- Next.js 15 frontend (Port 3000)
- Python/Rasa backend (Port 8000)
- Turso database (already configured)

---

## ✅ What's Already Configured

- ✅ Database (Turso) - Connected and ready
- ✅ JWT Authentication - Configured with tokens
- ✅ Frontend UI - Complete and functional
- ✅ API Routes - All endpoints ready

---

## 🔑 Required API Keys

### Currently Set (Already in `.env`)
```env
# Database (Turso) - ✅ Already configured
TURSO_CONNECTION_URL=libsql://db-c43dfc03-9b34-4145-9442-8ac9547c39b9-orchids.aws-us-west-2.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...

# Python Backend URL
PYTHON_BACKEND_URL=http://localhost:8000
```

### No Additional Keys Needed!

Your app is ready to run with the existing configuration. No external API keys required.

---

## 🏃 How to Run

### Option 1: Frontend Only (Limited Features)

**What Works:**
- ✅ User registration and login
- ✅ Create workspaces
- ✅ Upload files (saved to disk)
- ✅ Chat with fallback AI

**What Doesn't Work:**
- ❌ Dataset validation
- ❌ Model training
- ❌ Chat with trained models

**Run Command:**
```bash
bun run dev
```

Open: http://localhost:3000

---

### Option 2: Full Stack (All Features)

Run **both** servers simultaneously for complete functionality.

#### Terminal 1 - Next.js Frontend
```bash
bun run dev
```

#### Terminal 2 - Python Backend
```bash
cd python-rasa-backend
chmod +x start.sh
./start.sh
```

**Wait for:**
```
✅ Starting FastAPI server on port 8000...
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Then open: http://localhost:3000

---

## 🧪 Testing the App (2 Minutes)

### Step 1: Check Backend Status
1. Open http://localhost:3000
2. Look at the header (top right)
3. Status badge shows:
   - 🟢 **"Backend: Online"** → All features work
   - 🔴 **"Backend: Offline"** → Limited features

### Step 2: Register & Login
```
http://localhost:3000/register
```
Create an account with:
- Name: Your Name
- Email: your@email.com
- Password: (anything)

### Step 3: Create Workspace
1. Go to Dashboard: http://localhost:3000/dashboard
2. Click "New Workspace"
3. Name: "My First Bot"
4. Click "Create Workspace"

### Step 4: Upload Dataset
Test files are ready in `public/test-datasets/`:
- `sample-training.csv` (15 examples)
- `sample-training.json` (15 examples)
- `sample-training.yml` (Rasa format)

**Upload Steps:**
1. Click on your workspace
2. Go to "Datasets" tab
3. Drag & drop a test file
4. Wait for validation (needs Python backend)
5. Status shows "validated" with intent counts

### Step 5: Train Model (Optional)
1. Go to "Training" tab
2. Click "Start Training"
3. Watch progress: 0% → 100%
4. Takes ~30 seconds
5. Status changes to "completed"

### Step 6: Chat
1. Go to "Test Chat" tab
2. Try messages like:
   - "I want to book a flight"
   - "Hello"
   - "What can you do?"

---

## 🐍 Python Backend Setup (Detailed)

### Requirements
- Python 3.8-3.10 (NOT 3.11+ due to Rasa compatibility)

### First-Time Setup

```bash
cd python-rasa-backend

# 1. Create virtual environment
python3 -m venv venv

# 2. Activate it
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Train initial Rasa model
cd rasa
rasa train
cd ..

# 5. Start server
python app.py
```

### Subsequent Runs

```bash
cd python-rasa-backend
./start.sh
```

The startup script handles activation and server start automatically.

---

## 🏗️ Project Architecture

```
Frontend (Next.js)          Backend (Python)
┌──────────────┐           ┌──────────────┐
│ Port 3000    │──────────>│ Port 8000    │
│              │           │              │
│ • Upload UI  │  HTTP     │ • Validate   │
│ • Chat UI    │  Requests │ • Train      │
│ • Dashboard  │           │ • Inference  │
└──────┬───────┘           └──────┬───────┘
       │                          │
       │                          │
       v                          v
┌──────────────────────────────────────┐
│        Database (Turso)              │
│  • Users      • Datasets             │
│  • Workspaces • Training Jobs        │
└──────────────────────────────────────┘
```

---

## 📁 Key Files & Routes

### Frontend Routes
- `/` - Homepage with status indicator
- `/register` - User registration
- `/login` - User login
- `/dashboard` - Workspace management
- `/workspace/[id]` - Workspace details
- `/chat` - Chat interface

### API Routes
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/workspaces` - Create workspace
- `POST /api/datasets/upload` - Upload dataset
- `POST /api/datasets/[id]/validate` - Validate dataset
- `POST /api/datasets/[id]/train` - Train model
- `GET /api/training-jobs/[id]` - Check training status

### Python Backend Endpoints
- `GET /health` - Health check
- `POST /datasets/validate` - Parse and validate datasets
- `POST /train` - Train Rasa NLU models
- `POST /chat` - Chat with trained models

---

## 🔧 Configuration Files

### `.env` (Root - Next.js)
```env
TURSO_CONNECTION_URL=libsql://...
TURSO_AUTH_TOKEN=eyJhbGc...
PYTHON_BACKEND_URL=http://localhost:8000
```

### `python-rasa-backend/.env` (Python)
```env
NEXT_API_URL=http://localhost:3000/api
PORT=8000
```

---

## 🐛 Troubleshooting

### Python Backend Won't Start

**Error: "ModuleNotFoundError: No module named 'rasa'"**
```bash
cd python-rasa-backend
source venv/bin/activate
pip install -r requirements.txt
```

**Error: "Python version incompatible"**
- Rasa requires Python 3.8-3.10
- Check: `python --version`
- Install compatible version

### Dataset Validation Fails

**Check:**
1. Is Python backend running? Check http://localhost:8000/health
2. Is file format valid? Use test files from `public/test-datasets/`
3. Check Python backend logs for errors

### Training Gets Stuck

**Check:**
1. Dataset must be validated first (status: "validated")
2. Python backend must be running
3. Rasa model must be trained once: `cd python-rasa-backend/rasa && rasa train`
4. Check Python logs: `cd python-rasa-backend && cat logs/app.log`

### Chat Not Responding

**Two modes:**
1. **With trained model**: Requires Python backend + trained model
2. **Fallback AI**: Works without Python, gives basic responses

---

## 📦 What Gets Installed

### Frontend Dependencies (via bun)
- Next.js 15 - React framework
- Drizzle ORM - Database toolkit
- shadcn/ui - UI components
- JWT libraries - Authentication
- Lucide icons - Icon set

### Backend Dependencies (via pip)
- FastAPI - Web framework
- Rasa 3.6 - NLU framework
- spaCy - NLP library
- TensorFlow - ML framework
- Additional ML/NLP libraries

**Total install size:** ~2-3 GB (mostly ML models)

---

## 🚀 Deployment Notes

### Frontend (Vercel/Netlify)
```bash
bun run build
bun run start
```

### Backend (Docker)
```bash
cd python-rasa-backend
docker-compose up -d
```

See `python-rasa-backend/DEPLOYMENT.md` for production setup.

---

## 📊 Database Schema

Already set up in Turso:

- **users** - User accounts with JWT authentication
- **refresh_tokens** - Token management
- **workspaces** - Training workspaces
- **workspace_members** - Collaboration
- **datasets** - Uploaded training data
- **training_jobs** - Model training status
- **conversation_history** - Chat analytics

Manage via Database Studio tab (top right of page).

---

## ✨ Features Summary

| Feature | Works Without Python | Needs Python |
|---------|---------------------|--------------|
| User Registration/Login | ✅ | - |
| Create Workspaces | ✅ | - |
| Upload Files | ✅ | - |
| Dataset Validation | ❌ | ✅ |
| Model Training | ❌ | ✅ |
| Chat (Fallback AI) | ✅ | - |
| Chat (Trained Model) | ❌ | ✅ |
| NLU Insights | ❌ | ✅ |

---

## 🎯 Quick Command Reference

```bash
# Start Next.js
bun run dev

# Start Python Backend
cd python-rasa-backend && ./start.sh

# Train Rasa Model
cd python-rasa-backend/rasa && rasa train

# Check Python Status
curl http://localhost:8000/health

# Build for Production
bun run build && bun run start
```

---

## 📞 Support

- Check `README.md` for project overview
- Check `QUICK_START.md` for step-by-step guide
- Check Python logs: `python-rasa-backend/logs/app.log`
- Check browser console for frontend errors

---

## 🎉 You're Ready!

1. Run `bun run dev` (Terminal 1)
2. Run `cd python-rasa-backend && ./start.sh` (Terminal 2)
3. Open http://localhost:3000
4. Register an account
5. Start training chatbots! 🤖

**No external API keys needed - everything is pre-configured!**
