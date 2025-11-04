# EchoCart - AI Conversational Co-Shopper

A complete full-stack conversational AI shopping assistant powered by RASA NLU, Next.js 15, and modern AI technologies.

## 🎯 Features

### Frontend (Next.js 15 + TypeScript)
- ✅ **JWT Authentication** - Secure access/refresh token system with bcrypt password hashing
- ✅ **Workspace Management** - Create and manage multiple AI training workspaces
- ✅ **Dataset Management** - Upload and manage training datasets (CSV, JSON, RASA formats)
- ✅ **Conversational Chat Interface** - Real-time chat with mood detection and context awareness
- ✅ **Product Recommendations** - Emotion-aware product suggestions with sustainability scores
- ✅ **Order Tracking** - Narrative-style order status updates
- ✅ **Responsive Design** - Mobile-first with dark mode support

### Backend (Python + RASA)
- ✅ **RASA NLU** - Natural language understanding with DIET classifier
- ✅ **Custom Actions** - Product recommendations, order tracking, mood-based filtering
- ✅ **Recommendation Service** - Sentence transformers for semantic product matching
- ✅ **Visual Search** - CLIP-based image similarity search
- ✅ **Sentiment Analysis** - Real-time emotion detection from user messages
- ✅ **Microservices Architecture** - Scalable Python services with FastAPI

### Database (Turso/LibSQL)
- ✅ **User Management** - Secure user accounts with role-based access
- ✅ **Workspace Isolation** - Multi-tenant workspace architecture
- ✅ **Dataset Storage** - Training data versioning and validation
- ✅ **Conversation History** - Full chat analytics and tracking
- ✅ **Training Jobs** - ML model training pipeline management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and Bun
- Python 3.8+
- Docker & Docker Compose (optional)

### Frontend Setup

```bash
# Install dependencies
bun install

# The database is already configured with Turso
# JWT secrets are set in .env

# Run development server
bun dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd python-rasa-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Train RASA model
cd rasa
rasa train

# Start all services
cd ..
docker-compose up -d
```

## 📁 Project Structure

```
echocart/
├── src/
│   ├── app/                      # Next.js 15 app directory
│   │   ├── api/                  # API routes
│   │   │   ├── auth/             # Authentication endpoints
│   │   │   ├── workspaces/       # Workspace CRUD
│   │   │   ├── datasets/         # Dataset management
│   │   │   ├── chat/             # Chat history
│   │   │   └── training-jobs/    # Training status
│   │   ├── login/                # Login page
│   │   ├── register/             # Registration page
│   │   ├── dashboard/            # Workspace dashboard
│   │   └── chat/                 # Conversational interface
│   ├── components/               # React components
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/                      # Utilities
│   │   ├── auth.ts               # JWT authentication logic
│   │   └── authContext.tsx       # Auth React context
│   └── db/                       # Database
│       ├── schema.ts             # Drizzle ORM schema
│       └── seeds/                # Database seeders
│
├── python-rasa-backend/
│   ├── rasa/                     # RASA project
│   │   ├── data/                 # Training data (NLU, stories, rules)
│   │   ├── actions/              # Custom action server
│   │   ├── models/               # Trained models
│   │   ├── config.yml            # RASA configuration
│   │   ├── domain.yml            # Intents, entities, responses
│   │   ├── endpoints.yml         # Service endpoints
│   │   └── credentials.yml       # Channel credentials
│   ├── services/
│   │   ├── recommendation/       # Product recommendation API
│   │   └── visual_search/        # CLIP-based visual search
│   ├── requirements.txt          # Python dependencies
│   ├── docker-compose.yml        # Service orchestration
│   └── DEPLOYMENT.md             # Deployment guide
│
└── README.md                     # This file
```

## 🎓 Usage

### 1. Register an Account

Navigate to `/register` and create your account with email and password.

### 2. Create a Workspace

From the dashboard at `/dashboard`, create a workspace for your conversational AI project.

### 3. Upload Training Data (Optional)

Upload datasets in CSV, JSON, or RASA format to train your AI model with custom data.

### 4. Start Chatting

Open the chat interface and start conversing with your AI assistant!

**Example Conversations:**

```
User: "I'm feeling tired, show me something comfortable"
Bot: "You sound like you need comfort! Here are some cozy options..."
[Shows product recommendations with sustainability scores]

User: "Track my order #12345"
Bot: "Your package left the Mumbai hub 🚚 and is on its way..."
[Shows narrative tracking update]

User: "Show me eco-friendly products"
Bot: "Here are sustainable options with high eco-scores..."
[Filters products by sustainability]
```

## 🏗️ Architecture

### Authentication Flow

1. User registers/logs in → JWT tokens issued
2. Access token (15min) stored in localStorage
3. Refresh token (7 days) for token renewal
4. All API requests include Bearer token
5. Auto-refresh before token expiration

### Chat Flow

1. User sends message → Frontend
2. Frontend → RASA Server (webhook)
3. RASA → NLU Pipeline (intent/entity extraction)
4. RASA → Action Server (custom logic)
5. Action Server → Recommendation/Visual Search services
6. Action Server → Database (products, orders)
7. Response → Frontend (with product cards)
8. Save conversation → Database (analytics)

### Workspace Flow

1. User creates workspace
2. Uploads training datasets
3. Dataset validation runs
4. Training job enqueued
5. RASA model trained
6. Model deployed per workspace

## 📊 Database Management

You can manage your database through the **Database Studio** tab located at the top right of the page next to the "Analytics" tab.

**Database Tables:**
- `users` - User accounts with JWT authentication
- `workspaces` - AI training workspaces
- `datasets` - Training data files
- `training_jobs` - ML model training pipeline
- `conversation_history` - Chat analytics
- `refresh_tokens` - JWT token management
- `workspace_members` - Workspace collaboration

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/[id]` - Get workspace
- `PUT /api/workspaces/[id]` - Update workspace
- `DELETE /api/workspaces/[id]` - Delete workspace

### Datasets
- `GET /api/workspaces/[id]/datasets` - List datasets
- `POST /api/workspaces/[id]/datasets` - Upload dataset
- `GET /api/datasets/[id]` - Get dataset
- `POST /api/datasets/[id]/validate` - Validate dataset
- `POST /api/datasets/[id]/train` - Start training

### Chat
- `GET /api/chat/history` - Get conversation history
- `POST /api/chat/history` - Save conversation

## 🐳 Docker Deployment

```bash
# Start all Python services
cd python-rasa-backend
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📈 Features Deep Dive

### Mood-Based Shopping
The AI detects emotional context from user messages and adapts recommendations:
- "tired" → cozy, comfortable items
- "energetic" → dynamic, sporty products
- "stressed" → calming, peaceful options
- "excited" → fun, trendy selections

### Sustainability Scoring
Every product includes:
- Eco-score (0-100%)
- Material composition
- Carbon footprint estimate
- Certifications (Fair Trade, GOTS, etc.)

### Narrative Order Tracking
Instead of "Order shipped," you get:
> "Your sneakers left the Mumbai hub 🚚, crossing Pune by midnight — estimated delivery: Tuesday noon."

## 🧪 Testing with Seeded Data

The database comes with pre-seeded test data:
- **5 test users** (password: `password123`)
- **8 sample workspaces**
- **10 datasets** with various formats
- **15 conversation examples**

You can log in with any seeded user to explore the system.

## 🤝 Contributing

This is a complete implementation. To extend:

1. Add more RASA intents in `python-rasa-backend/rasa/data/nlu.yml`
2. Create custom actions in `python-rasa-backend/rasa/actions/actions.py`
3. Add UI components in `src/components/`
4. Extend API routes in `src/app/api/`

## 📝 License

MIT License

## 🎉 Acknowledgments

- RASA for conversational AI framework
- Next.js team for the App Router
- shadcn/ui for beautiful components
- Turso for edge database
- OpenAI CLIP for visual search
- Sentence Transformers for semantic search

## 📞 Support

For detailed deployment instructions, see `/python-rasa-backend/DEPLOYMENT.md`

For database management, use the **Database Studio** tab in the navigation.

---

**Built with ❤️ using Next.js 15, RASA NLU, Python, and modern AI technologies**