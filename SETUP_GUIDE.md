# 🚀 EchoCart - Complete Setup Guide

## 📁 Dataset Location

Your complete Rasa training dataset is located in:
```
python-rasa-backend/rasa/data/
├── nlu.yml      # Intent & entity training examples (400+ examples)
├── stories.yml  # Conversation flow patterns
└── rules.yml    # Rule-based responses
```

The dataset includes **comprehensive training data** for:
- ✅ Emotion-aware recommendations (tired, excited, stressed, lazy, etc.)
- ✅ Product search by category, mood, occasion, price
- ✅ Order tracking
- ✅ Sustainability queries
- ✅ Returns & exchanges
- ✅ Visual search
- ✅ Group shopping

---

## 🎯 Quick Start (3 Steps)

### Step 1: Install & Train Rasa

```bash
# Navigate to Rasa directory
cd python-rasa-backend/rasa

# Install Rasa (requires Python 3.8-3.10)
pip install rasa==3.6.0 rasa-sdk==3.6.0

# Train the model with your dataset
rasa train

# This creates a trained model in models/ directory
```

### Step 2: Start Rasa Servers (2 terminals)

**Terminal 1 - Rasa Server:**
```bash
cd python-rasa-backend/rasa
rasa run --enable-api --cors "*" --port 5005
```

**Terminal 2 - Action Server:**
```bash
cd python-rasa-backend/rasa
rasa run actions --port 5055
```

### Step 3: Start Next.js Frontend

```bash
# In project root
npm install
npm run dev
```

**Done!** Visit http://localhost:3000

---

## 🧪 Test Prompts - Try These!

### Emotion-Based Shopping
```
- "I'm tired, show me cozy clothes"
- "Feeling stressed, need comfort"
- "I'm excited for a party, need outfit ideas"
- "Lazy day, show me comfortable stuff"
- "Feeling adventurous, what do you recommend?"
```

### Product Search
```
- "I need comfortable shoes"
- "Show me laptops under $1000"
- "Looking for eco-friendly products"
- "Need a gift for my sister"
- "Blue sneakers for running"
```

### Mood + Category Combinations
```
- "I'm tired, need comfortable shoes"
- "Feeling professional, show me work clothes"
- "Excited mood, colorful products please"
- "Stressed, show me relaxing items"
```

### Advanced Features
```
- "Track my order"
- "Show me sustainable products"
- "Eco-friendly shoes under $100"
- "Top rated electronics"
- "I want to return an item"
```

---

## 📊 Dataset Breakdown

### **nlu.yml** - 15 Intents with 400+ Examples

1. **greet** (13 examples)
   - "hi", "hello", "good morning", etc.

2. **ask_recommendation** (100+ examples)
   - Product requests with mood, category, price
   - Examples: "I need [comfortable shoes]", "Show me [eco-friendly] products"

3. **express_mood** (30+ examples)
   - Mood states: tired, excited, stressed, lazy, adventurous
   - Examples: "I'm feeling [lazy] today", "Really [energetic] right now"

4. **track_order** (20+ examples)
   - Order tracking queries
   - Examples: "Track my order", "Where is order [12345]?"

5. **ask_sustainability** (20+ examples)
   - Eco-friendly product queries
   - Examples: "Show me eco-friendly products", "Sustainable options"

6. **ask_price_range** (15+ examples)
   - Budget filtering
   - Examples: "Under [$100]", "Between [$50] and [$200]"

7. **return_request** (15+ examples)
   - Return/exchange requests

8. **add_to_cart** (15+ examples)
   - Cart operations

9. **affirm, deny, thank, goodbye** (40+ examples)
   - Conversational flow

### **stories.yml** - 15 Conversation Flows

Complete shopping journeys including:
- Greet → Mood detection → Recommendations → Purchase
- Product search → Price filter → Sustainability check
- Order tracking → Return request
- Multi-turn conversations

### **rules.yml** - 7 Rule-Based Responses

Immediate responses for:
- Greetings
- Goodbyes
- Bot challenges
- Help requests
- Order tracking

---

## 🔧 Configuration Files

### Rasa Config (`config.yml`)
- **NLU Pipeline**: WhitespaceTokenizer, DIETClassifier
- **Policies**: MemoizationPolicy, RulePolicy, TEDPolicy
- **Training**: 100 epochs for high accuracy

### Domain (`domain.yml`)
- **15 intents** configured
- **8 entities**: mood, product_type, preference, occasion, price, etc.
- **10 slots** for context tracking
- **10+ utterance templates** with personality

### Endpoints (`endpoints.yml`)
- Action server: `http://localhost:5055/webhook`

### Credentials (`credentials.yml`)
- REST channel for Next.js integration
- SocketIO support

---

## 🎨 Custom Actions (actions.py)

### Implemented Actions:

1. **ActionRecommendProducts**
   - Emotion-aware product recommendations
   - Mood-to-product mapping
   - Context-based filtering

2. **ActionTrackOrder**
   - Narrative-style order updates
   - Real-time tracking info

3. **ActionRecommendSustainableProducts**
   - Eco-friendly product filtering
   - Sustainability scoring

4. **ActionFilterByPrice**
   - Budget-based filtering

5. **ActionFilterByRating**
   - Top-rated products

6. **ActionVisualSearch**
   - Image similarity search (placeholder)

7. **ActionCreateGroupSession**
   - Group shopping sessions

8. **ActionReturnProcess**
   - Conversational returns

---

## 🌐 Environment Variables

Create `.env` file in project root:

```env
# Rasa Configuration
RASA_URL=http://localhost:5005
NEXT_PUBLIC_RASA_URL=http://localhost:5005

# Database (already configured via database agent)
DATABASE_URL=your_database_url

# Optional: External Services
RECOMMENDATION_API=http://localhost:8001
VISUAL_SEARCH_API=http://localhost:8002
```

---

## 🧩 System Architecture

```
┌─────────────────────────────────────────────┐
│         Next.js Frontend (Port 3000)        │
│  • Chat UI                                  │
│  • Workspace Management                     │
│  • Authentication                           │
└─────────────────┬───────────────────────────┘
                  │
                  ↓ API Calls
┌─────────────────────────────────────────────┐
│      Next.js API Routes (/api/chat)         │
│  • Forwards to Rasa                         │
│  • Saves conversation history               │
└─────────────────┬───────────────────────────┘
                  │
                  ↓ REST Webhook
┌─────────────────────────────────────────────┐
│         Rasa Server (Port 5005)             │
│  • NLU: Intent & Entity Detection           │
│  • Core: Dialogue Management                │
│  • Trained Model: models/*.tar.gz           │
└─────────────────┬───────────────────────────┘
                  │
                  ↓ Action Calls
┌─────────────────────────────────────────────┐
│       Action Server (Port 5055)             │
│  • Product Recommendations                  │
│  • Order Tracking                           │
│  • Sustainability Scoring                   │
│  • Custom Business Logic                    │
└─────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Rasa"
**Solution:**
1. Ensure Rasa server is running: `rasa run --enable-api --cors "*"`
2. Check port 5005 is not in use
3. Verify `NEXT_PUBLIC_RASA_URL` in `.env`

### Issue: "Action server not responding"
**Solution:**
1. Start action server: `rasa run actions`
2. Check `endpoints.yml` has correct URL
3. Verify port 5055 is available

### Issue: "Model not found"
**Solution:**
1. Train the model: `rasa train`
2. Check `models/` directory for `.tar.gz` file
3. Restart Rasa server

### Issue: "Poor intent recognition"
**Solution:**
1. Add more training examples to `data/nlu.yml`
2. Retrain: `rasa train`
3. Test: `rasa shell nlu`

---

## 📝 Adding More Training Data

### 1. Edit `data/nlu.yml`

```yaml
- intent: your_new_intent
  examples: |
    - example 1
    - example 2
    - example with [entity](entity_name)
```

### 2. Edit `domain.yml`

```yaml
intents:
  - your_new_intent

responses:
  utter_your_response:
  - text: "Your response text"
```

### 3. Edit `data/stories.yml`

```yaml
- story: your story name
  steps:
  - intent: your_new_intent
  - action: utter_your_response
```

### 4. Retrain

```bash
rasa train
```

---

## 🎯 Testing the System

### Interactive Testing
```bash
# Test in shell
cd python-rasa-backend/rasa
rasa shell

# Test NLU only
rasa shell nlu
```

### API Testing
```bash
# Test Rasa webhook directly
curl -X POST http://localhost:5005/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "test_user",
    "message": "I am tired, show me cozy clothes"
  }'
```

### Frontend Testing
1. Register an account at http://localhost:3000/register
2. Login at http://localhost:3000/login
3. Go to Dashboard and create a workspace
4. Click "Start Chat" on a workspace
5. Try the test prompts listed above!

---

## 🚀 Production Deployment

### Rasa Deployment
1. Use Docker: `docker build -t echocart-rasa .`
2. Deploy to cloud (AWS, GCP, Azure)
3. Use Rasa X for model management
4. Set up Redis for tracker store

### Next.js Deployment
1. Deploy to Vercel/Netlify
2. Update `NEXT_PUBLIC_RASA_URL` to production URL
3. Configure database connection
4. Set up environment variables

---

## 📚 Resources

- **Rasa Documentation**: https://rasa.com/docs/
- **Training Data Best Practices**: https://rasa.com/docs/rasa/training-data-format
- **Custom Actions Guide**: https://rasa.com/docs/rasa/custom-actions

---

## ✅ Success Checklist

- [ ] Python 3.8-3.10 installed
- [ ] Rasa installed (`pip install rasa`)
- [ ] Model trained (`rasa train`)
- [ ] Rasa server running (port 5005)
- [ ] Action server running (port 5055)
- [ ] Next.js dev server running (port 3000)
- [ ] Environment variables configured
- [ ] Test conversation successful
- [ ] Products showing in chat responses

---

## 🎉 You're All Set!

Your EchoCart chatbot is now fully functional with:
✅ 400+ training examples across 15 intents
✅ Emotion-aware product recommendations
✅ Order tracking with narrative updates
✅ Sustainability scoring
✅ Full end-to-end integration

**Start chatting**: http://localhost:3000/dashboard → Create Workspace → Start Chat

**Try**: "I'm feeling tired, show me something cozy" 🛋️
