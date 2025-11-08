# EchoChat - NLU Chatbot Training Platform

A complete NLU chatbot training platform powered by Rasa NLU and Next.js 15.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Bun
- Python 3.8-3.10 (for backend features)

### Run Frontend Only
```bash
bun install
bun run dev
```
Open http://localhost:3000

**Works without Python:** Registration, login, workspaces, file uploads, fallback chat

### Run Full Stack (Recommended)
**Terminal 1 - Frontend:**
```bash
bun run dev
```

**Terminal 2 - Python Backend:**
```bash
cd python-rasa-backend
chmod +x start.sh
./start.sh
```

**All Features Enabled:** Dataset validation, model training, NLU chat

---

## 🔑 API Keys Required

### ✅ Already Configured (No Action Needed)
- **Database (Turso)** - Already in `.env`
- **JWT Secrets** - Already configured
- **Python Backend URL** - Already set

### ❌ No External Keys Required
This app works out of the box! No additional API keys needed.

---

## 📋 What Can You Do?

### Without Python Backend (Limited)
- ✅ User registration and login
- ✅ Create and manage workspaces
- ✅ Upload dataset files (CSV/JSON/Rasa)
- ✅ Chat with basic fallback AI

### With Python Backend (Full Features)
- ✅ **Everything above, PLUS:**
- ✅ Dataset validation (parse intents/entities)
- ✅ Train custom NLU models with Rasa
- ✅ Chat with YOUR trained models
- ✅ Real-time training progress tracking
- ✅ NLU insights (intent/entity extraction)

---

## 🧪 Test It Out (2 Minutes)

1. **Register:** http://localhost:3000/register
2. **Create Workspace:** Click "New Workspace" on dashboard
3. **Upload Dataset:** Use test files from `public/test-datasets/`
   - `sample-training.csv`
   - `sample-training.json`
   - `sample-training.yml`
4. **Train Model:** Click "Start Training" (takes ~30 seconds)
5. **Chat:** Test your trained bot!

---

## 📁 Project Structure

```
echochat/
├── src/
│   ├── app/                    # Next.js 15 routes
│   │   ├── api/               # API endpoints
│   │   ├── dashboard/         # Workspace management
│   │   ├── chat/              # Chat interface
│   │   ├── login/             # Authentication
│   │   └── workspace/         # Workspace details
│   ├── components/ui/         # UI components (shadcn)
│   ├── lib/                   # Utilities & auth
│   └── db/                    # Database schema
│
├── python-rasa-backend/       # Python/Rasa backend
│   ├── app.py                 # FastAPI server
│   ├── rasa/                  # Rasa NLU project
│   ├── requirements.txt       # Python dependencies
│   └── start.sh              # Startup script
│
└── public/
    └── test-datasets/         # Sample training data
```

---

## 🎯 Key Features

### 🔐 Authentication
- JWT-based with access + refresh tokens
- Secure password hashing with bcrypt
- Auto-refresh before token expiration

### 🏢 Workspace Management
- Multi-tenant workspaces
- Isolated training environments
- Collaborative workspace support

### 📊 Dataset Management
- Support for CSV, JSON, and Rasa formats
- Automatic validation and parsing
- Intent and entity extraction
- Sample count tracking

### 🤖 NLU Training
- Powered by Rasa NLU framework
- Real-time training progress
- Custom model per workspace
- Training history and logs

### 💬 Chat Interface
- Test trained models in real-time
- Fallback AI for instant testing
- Conversation history tracking
- Intent/entity display

---

## 🐍 Python Backend Setup

### First Time Setup
```bash
cd python-rasa-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train initial model
cd rasa
rasa train
cd ..

# Start server
python app.py
```

### Subsequent Runs
```bash
cd python-rasa-backend
./start.sh
```

---

## 🔧 Configuration

### Environment Variables

**`.env` (Root - Next.js):**
```env
TURSO_CONNECTION_URL=libsql://...      # Already configured
TURSO_AUTH_TOKEN=...                   # Already configured
PYTHON_BACKEND_URL=http://localhost:8000
```

**`python-rasa-backend/.env` (Python):**
```env
NEXT_API_URL=http://localhost:3000/api
PORT=8000
```

---

## 🐛 Troubleshooting

### Backend Status Indicator

Check the header on the homepage:
- 🟢 **"Backend: Online"** → All features work
- 🔴 **"Backend: Offline"** → Start Python backend

### Common Issues

**"Backend: Offline" on homepage**
```bash
cd python-rasa-backend
./start.sh
```

**Dataset validation fails**
- Check Python backend is running: `curl http://localhost:8000/health`
- Use test files from `public/test-datasets/`

**Training button disabled**
- Upload and validate a dataset first
- Python backend must be running

**Python version error**
- Rasa requires Python 3.8-3.10 (NOT 3.11+)
- Install compatible version

---

## 📚 Documentation

- **`SETUP.md`** - Detailed setup instructions
- **`QUICK_START.md`** - Step-by-step quick start guide
- **`python-rasa-backend/DEPLOYMENT.md`** - Production deployment
- **`python-rasa-backend/README.md`** - Python backend docs

---

## 🗄️ Database Management

Access **Database Studio** tab (top right) to manage:
- Users and authentication
- Workspaces and members
- Datasets and training jobs
- Conversation history

Database is already set up with Turso (LibSQL).

---

## 🚀 Deployment

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

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Drizzle ORM

**Backend:**
- Python 3.8-3.10
- FastAPI
- Rasa NLU 3.6
- TensorFlow
- spaCy

**Database:**
- Turso (LibSQL)
- SQLite-compatible

---

## 📦 Installation Size

- Frontend: ~500 MB
- Python Backend: ~2-3 GB (ML models)
- Total: ~3 GB

---

## 🎉 You're Ready!

1. Install: `bun install`
2. Start frontend: `bun run dev`
3. (Optional) Start backend: `cd python-rasa-backend && ./start.sh`
4. Open: http://localhost:3000
5. Start training chatbots! 🤖

**No API keys needed - everything is pre-configured!**

---

## 📄 License

MIT License

---

**Built with ❤️ using Next.js 15, Rasa NLU, and modern web technologies**