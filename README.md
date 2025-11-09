# EchoCart Python/RASA Backend

This is the Python backend for EchoCart - a conversational AI shopping assistant powered by RASA NLU.

## Architecture

```
python-rasa-backend/
├── rasa/                    # RASA project files
│   ├── data/               # Training data
│   ├── models/             # Trained models
│   ├── actions/            # Custom action server
│   ├── config.yml          # RASA configuration
│   ├── domain.yml          # Domain definition
│   ├── credentials.yml     # Channel credentials
│   └── endpoints.yml       # Endpoint configuration
├── services/               # Microservices
│   ├── recommendation/     # Recommendation engine
│   ├── visual_search/      # CLIP-based visual search
│   ├── sentiment/          # Sentiment analysis
│   └── api_gateway/        # API gateway
├── requirements.txt        # Python dependencies
└── docker-compose.yml      # Docker setup
```

## Prerequisites

- Python 3.8+
- Docker & Docker Compose
- RASA 3.6+
- PostgreSQL (for production)
- Redis (for caching)

## Installation

### 1. Setup Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/echocart
TURSO_CONNECTION_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token

# RASA
RASA_MODEL_PATH=./rasa/models
RASA_SERVER_URL=http://localhost:5005

# Next.js Backend
NEXT_API_URL=http://localhost:3000/api

# Recommendation Service
VECTOR_DB_URL=http://localhost:8000
EMBEDDING_MODEL=all-mpnet-base-v2

# Visual Search
CLIP_MODEL=ViT-B/32

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### 4. Train RASA Model

```bash
cd rasa
rasa train
```

### 5. Start Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start individual services:
# RASA server
rasa run --enable-api --cors "*" --port 5005

# Action server
rasa run actions --port 5055

# Recommendation service
python services/recommendation/server.py

# Visual search service
python services/visual_search/server.py
```

## API Endpoints

### RASA Chat API

```
POST http://localhost:5005/webhooks/rest/webhook
Content-Type: application/json

{
  "sender": "user_123",
  "message": "I need comfortable shoes for running"
}
```

### Recommendation API

```
POST http://localhost:8001/recommend
Content-Type: application/json

{
  "query": "comfortable running shoes",
  "user_id": 123,
  "workspace_id": 1,
  "filters": {
    "price_max": 100,
    "sustainability_min": 0.6
  }
}
```

### Visual Search API

```
POST http://localhost:8002/visual-search
Content-Type: multipart/form-data

image: <file>
workspace_id: 1
limit: 10
```

## Development

### Run Tests

```bash
# Unit tests
pytest tests/

# RASA tests
cd rasa
rasa test
```

### Train Model

```bash
cd rasa
rasa train --data data/ --config config.yml --out models/
```

### Interactive Learning

```bash
cd rasa
rasa interactive
```

## Integration with Next.js

The Python backend integrates with your Next.js application through:

1. **Webhook Integration**: RASA sends responses back to Next.js via webhooks
2. **REST API**: Next.js calls Python services for recommendations and visual search
3. **Database Sharing**: Both share the same PostgreSQL/Turso database

## Production Deployment

### Using Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Using Kubernetes

```bash
kubectl apply -f k8s/
```

## Monitoring

- RASA X for conversation analytics (optional): http://localhost:5005
- Prometheus metrics: http://localhost:9090
- Grafana dashboards: http://localhost:3001

## Documentation

- [RASA Documentation](https://rasa.com/docs/)
- [Action Server Guide](./docs/action-server.md)
- [Recommendation Engine](./docs/recommendation-engine.md)
- [Visual Search Service](./docs/visual-search.md)
