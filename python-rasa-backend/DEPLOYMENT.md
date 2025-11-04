# EchoCart Python/RASA Backend Deployment Guide

## Quick Start

### Development Setup

1. **Clone and Setup**
```bash
cd python-rasa-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Train RASA Model**
```bash
cd rasa
rasa train
```

4. **Start Services**
```bash
# Terminal 1: RASA server
rasa run --enable-api --cors "*" --port 5005

# Terminal 2: Action server
rasa run actions --port 5055

# Terminal 3: Recommendation service
python services/recommendation/server.py

# Terminal 4: Visual search service
python services/visual_search/server.py
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Integration with Next.js

### 1. Environment Variables in Next.js

Add to your Next.js `.env.local`:

```env
# Python Backend URLs
NEXT_PUBLIC_RASA_URL=http://localhost:5005
RASA_ACTION_SERVER_URL=http://localhost:5055
RECOMMENDATION_SERVICE_URL=http://localhost:8001
VISUAL_SEARCH_URL=http://localhost:8002
```

### 2. API Integration

The Next.js app connects to Python services via:

- **RASA Chat**: POST to `/webhooks/rest/webhook`
- **Recommendations**: POST to `/recommend`
- **Visual Search**: POST to `/visual-search`

## Production Deployment

### AWS/GCP/Azure

1. **Container Registry**
```bash
# Build images
docker build -t echocart-rasa:latest -f rasa/Dockerfile .
docker build -t echocart-actions:latest -f rasa/Dockerfile.actions .
docker build -t echocart-recommendations:latest services/recommendation/
docker build -t echocart-visual-search:latest services/visual_search/

# Push to registry
docker tag echocart-rasa:latest your-registry/echocart-rasa:latest
docker push your-registry/echocart-rasa:latest
```

2. **Kubernetes Deployment**
```bash
kubectl apply -f k8s/
```

3. **Environment Variables**
Set these in your cloud provider:
- `TURSO_CONNECTION_URL`
- `TURSO_AUTH_TOKEN`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NEXT_API_URL`

### Monitoring

- RASA metrics: `http://your-rasa-server:5005/metrics`
- Health checks:
  - RASA: `http://your-rasa-server:5005/`
  - Recommendations: `http://recommendation-service:8001/health`
  - Visual Search: `http://visual-search:8002/health`

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
rasa:
  deploy:
    replicas: 3
    
recommendation-service:
  deploy:
    replicas: 2
```

### Load Balancing

Use Nginx or cloud provider load balancers to distribute traffic across RASA and service replicas.

## Database Management

### RASA Tracker Store

The conversation history is stored in PostgreSQL for production:

```bash
# Backup tracker database
docker exec -t postgres pg_dump -U rasa rasa_tracker > backup.sql

# Restore
docker exec -i postgres psql -U rasa rasa_tracker < backup.sql
```

### Turso/LibSQL Integration

All product data, orders, and user info remain in your existing Turso database. The Python services connect via the same credentials.

## Performance Optimization

### Caching

Redis is used for:
- Recommendation caching (1 hour TTL)
- CLIP embedding caching
- Session data

### Model Optimization

- Use ONNX for faster RASA inference
- Quantize embedding models for production
- Implement model versioning with RASA X

## Security

1. **API Authentication**
   - All Python services validate JWT tokens from Next.js
   - Use HTTPS in production

2. **CORS Configuration**
   - Restrict origins to your domain
   - Update `CORSMiddleware` in FastAPI services

3. **Secrets Management**
   - Use Kubernetes secrets or cloud provider secret managers
   - Never commit `.env` files

## Troubleshooting

### RASA Not Responding

```bash
# Check logs
docker-compose logs rasa

# Restart service
docker-compose restart rasa
```

### Action Server Errors

```bash
# View action server logs
docker-compose logs action-server

# Test action endpoint
curl http://localhost:5055/health
```

### Recommendation Service Issues

```bash
# Check if embeddings model is loaded
docker-compose logs recommendation-service

# Test directly
curl -X POST http://localhost:8001/recommend \
  -H "Content-Type: application/json" \
  -d '{"query":"shoes","user_id":1,"workspace_id":1}'
```

## Maintenance

### Update RASA Model

```bash
# Train new model
cd rasa
rasa train

# Replace in production
docker-compose restart rasa
```

### Database Migrations

```bash
# Run Alembic migrations
alembic upgrade head
```

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- RASA docs: https://rasa.com/docs/
- GitHub issues: [your-repo]/issues
