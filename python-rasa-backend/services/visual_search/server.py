"""
Visual Search Service for EchoCart
Uses CLIP for image-based product search
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import torch
import clip
from PIL import Image
import io
import numpy as np
import redis
import json
import os

app = FastAPI(title="EchoCart Visual Search Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load CLIP model
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# Redis for caching
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))


@app.post("/visual-search")
async def visual_search(
    image: UploadFile = File(...),
    workspace_id: int = Form(...),
    limit: int = Form(10)
) -> Dict:
    """
    Search for products using an uploaded image
    """
    
    try:
        # Read and preprocess image
        image_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Encode image with CLIP
        image_input = preprocess(pil_image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            image_features = model.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)
        
        # Mock product database with pre-computed embeddings
        # In production, query vector database (FAISS, Pinecone, etc.)
        similar_products = find_similar_products(
            image_features.cpu().numpy(),
            workspace_id,
            limit
        )
        
        return {
            "products": similar_products,
            "total_results": len(similar_products),
            "workspace_id": workspace_id
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visual search failed: {str(e)}")


def find_similar_products(
    query_embedding: np.ndarray,
    workspace_id: int,
    limit: int
) -> List[Dict]:
    """
    Find products similar to the query image embedding
    """
    
    # Mock product data with similarity scores
    # In production, use vector database for efficient similarity search
    products = [
        {
            "id": "P001",
            "name": "Similar Product 1",
            "description": "Looks like what you uploaded",
            "price": 49.99,
            "image_url": "/products/similar1.jpg",
            "similarity_score": 0.92
        },
        {
            "id": "P002",
            "name": "Similar Product 2",
            "description": "Another great match",
            "price": 59.99,
            "image_url": "/products/similar2.jpg",
            "similarity_score": 0.88
        },
        {
            "id": "P003",
            "name": "Similar Product 3",
            "description": "You might also like this",
            "price": 44.99,
            "image_url": "/products/similar3.jpg",
            "similarity_score": 0.85
        },
    ]
    
    return products[:limit]


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "visual-search"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
