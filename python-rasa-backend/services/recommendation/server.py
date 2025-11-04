"""
Recommendation Service for EchoCart
Provides emotion-aware product recommendations using embeddings
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import numpy as np
from sentence_transformers import SentenceTransformer
import redis
import json
import os

app = FastAPI(title="EchoCart Recommendation Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
embedding_model = SentenceTransformer('all-mpnet-base-v2')

# Redis for caching
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))

# Mood mappings for emotion-aware recommendations
MOOD_KEYWORDS = {
    "tired": ["comfortable", "cozy", "soft", "relaxing", "gentle"],
    "energetic": ["dynamic", "vibrant", "active", "sporty", "bold"],
    "stressed": ["calming", "peaceful", "soothing", "comfortable", "simple"],
    "excited": ["fun", "colorful", "trendy", "new", "exciting"],
    "professional": ["formal", "elegant", "sophisticated", "business", "classic"],
    "casual": ["relaxed", "everyday", "simple", "versatile", "comfortable"],
    "festive": ["celebration", "party", "special", "decorative", "joyful"],
}


class RecommendationRequest(BaseModel):
    query: str
    user_id: int
    workspace_id: int
    mood: Optional[str] = None
    sentiment: Optional[str] = None
    category: Optional[str] = None
    price_range: Optional[str] = None
    sustainability_min: float = 0.0
    limit: int = 5


class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    rating: float
    image_url: str
    sustainability_score: float
    relevance_score: float


@app.post("/recommend")
async def recommend_products(request: RecommendationRequest) -> Dict:
    """
    Generate product recommendations based on query, mood, and preferences
    """
    
    # Build enhanced query with mood keywords
    enhanced_query = request.query
    if request.mood and request.mood.lower() in MOOD_KEYWORDS:
        mood_keywords = " ".join(MOOD_KEYWORDS[request.mood.lower()])
        enhanced_query = f"{request.query} {mood_keywords}"
    
    # Check cache
    cache_key = f"rec:{request.user_id}:{enhanced_query}:{request.sustainability_min}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Generate query embedding
    query_embedding = embedding_model.encode(enhanced_query)
    
    # Mock product database (in production, this would query your actual database)
    mock_products = generate_mock_products(request)
    
    # Compute similarity scores
    products_with_scores = []
    for product in mock_products:
        product_text = f"{product['name']} {product['description']} {product['category']}"
        product_embedding = embedding_model.encode(product_text)
        
        # Cosine similarity
        similarity = np.dot(query_embedding, product_embedding) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(product_embedding)
        )
        
        # Apply filters
        if product['sustainability_score'] < request.sustainability_min:
            continue
        
        products_with_scores.append({
            **product,
            'relevance_score': float(similarity)
        })
    
    # Sort by relevance and return top N
    products_with_scores.sort(key=lambda x: x['relevance_score'], reverse=True)
    top_products = products_with_scores[:request.limit]
    
    result = {
        "products": top_products,
        "query": request.query,
        "enhanced_query": enhanced_query,
        "mood": request.mood,
        "total_results": len(products_with_scores)
    }
    
    # Cache results
    redis_client.setex(cache_key, 3600, json.dumps(result))
    
    return result


def generate_mock_products(request: RecommendationRequest) -> List[Dict]:
    """Generate mock products for demonstration"""
    
    products = [
        {
            "id": "P001",
            "name": "Ultra Comfort Joggers",
            "description": "Soft cotton joggers perfect for relaxation",
            "price": 49.99,
            "category": "clothing",
            "rating": 4.7,
            "image_url": "/products/joggers.jpg",
            "sustainability_score": 0.85
        },
        {
            "id": "P002",
            "name": "Professional Laptop Bag",
            "description": "Elegant leather laptop bag for business",
            "price": 89.99,
            "category": "accessories",
            "rating": 4.8,
            "image_url": "/products/laptop-bag.jpg",
            "sustainability_score": 0.72
        },
        {
            "id": "P003",
            "name": "Eco-Friendly Water Bottle",
            "description": "Sustainable stainless steel water bottle",
            "price": 24.99,
            "category": "lifestyle",
            "rating": 4.9,
            "image_url": "/products/bottle.jpg",
            "sustainability_score": 0.95
        },
        {
            "id": "P004",
            "name": "Running Sneakers Pro",
            "description": "High-performance running shoes with cushioning",
            "price": 129.99,
            "category": "footwear",
            "rating": 4.6,
            "image_url": "/products/sneakers.jpg",
            "sustainability_score": 0.68
        },
        {
            "id": "P005",
            "name": "Cozy Throw Blanket",
            "description": "Soft fleece blanket for ultimate comfort",
            "price": 39.99,
            "category": "home",
            "rating": 4.8,
            "image_url": "/products/blanket.jpg",
            "sustainability_score": 0.78
        },
    ]
    
    # Filter by category if specified
    if request.category:
        products = [p for p in products if p['category'] == request.category]
    
    return products


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "recommendation"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
