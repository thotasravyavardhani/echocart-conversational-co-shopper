"""
EchoChat FastAPI Backend - Dataset Processing & NLU Training
Handles CSV/JSON/Rasa format datasets and Rasa NLU model training
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import csv
import yaml
import os
from datetime import datetime
import asyncio
import aiohttp

app = FastAPI(title="EchoChat Backend", version="1.0.0")

# CORS middleware for Next.js integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
NEXT_API_URL = os.getenv("NEXT_API_URL", "http://localhost:3000/api")
RASA_URL = os.getenv("RASA_URL", "http://localhost:5005")

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class DatasetValidationRequest(BaseModel):
    dataset_id: int
    file_path: str
    format: str

class DatasetValidationResponse(BaseModel):
    valid: bool
    intents: Optional[List[str]] = []
    entities: Optional[List[str]] = []
    sample_count: int
    errors: Optional[List[str]] = []

class TrainingRequest(BaseModel):
    dataset_id: int
    training_job_id: int
    file_path: str
    format: str

class TrainingStatusResponse(BaseModel):
    status: str
    progress: float
    log: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    sender: str
    metadata: Optional[Dict[str, Any]] = {}

# ============================================================================
# DATASET VALIDATION
# ============================================================================

def validate_csv_format(file_path: str) -> Dict[str, Any]:
    """Validate CSV dataset format"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
        if not rows:
            return {"valid": False, "errors": ["CSV file is empty"]}
        
        # Expected columns: text, intent, entities (optional)
        required_cols = {'text', 'intent'}
        cols = set(rows[0].keys())
        
        if not required_cols.issubset(cols):
            return {
                "valid": False,
                "errors": [f"Missing required columns. Expected: {required_cols}, Found: {cols}"]
            }
        
        intents = list(set(row['intent'] for row in rows if row.get('intent')))
        entities = []
        
        # Parse entities if present
        if 'entities' in cols:
            for row in rows:
                if row.get('entities'):
                    try:
                        ents = json.loads(row['entities'])
                        entities.extend([e.get('entity') for e in ents if e.get('entity')])
                    except:
                        pass
        
        entities = list(set(entities))
        
        return {
            "valid": True,
            "intents": intents,
            "entities": entities,
            "sample_count": len(rows),
            "errors": []
        }
    except Exception as e:
        return {"valid": False, "errors": [f"CSV parsing error: {str(e)}"]}

def validate_json_format(file_path: str) -> Dict[str, Any]:
    """Validate JSON dataset format"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            data = [data]
        
        if not data:
            return {"valid": False, "errors": ["JSON file is empty"]}
        
        intents = []
        entities = []
        
        for item in data:
            if 'intent' in item:
                intents.append(item['intent'])
            if 'entities' in item:
                entities.extend([e.get('entity') for e in item['entities'] if isinstance(e, dict) and e.get('entity')])
        
        intents = list(set(intents))
        entities = list(set(entities))
        
        return {
            "valid": True,
            "intents": intents,
            "entities": entities,
            "sample_count": len(data),
            "errors": []
        }
    except Exception as e:
        return {"valid": False, "errors": [f"JSON parsing error: {str(e)}"]}

def validate_rasa_format(file_path: str) -> Dict[str, Any]:
    """Validate Rasa YAML/YML format"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        if not data:
            return {"valid": False, "errors": ["YAML file is empty"]}
        
        intents = []
        entities = []
        sample_count = 0
        
        # Parse nlu data
        if 'nlu' in data:
            nlu_data = data['nlu']
            for item in nlu_data:
                if 'intent' in item:
                    intents.append(item['intent'])
                    if 'examples' in item:
                        examples = item['examples'].split('\n')
                        sample_count += len([e for e in examples if e.strip().startswith('-')])
        
        # Parse entities from examples
        if 'nlu' in data:
            for item in data['nlu']:
                if 'examples' in item:
                    examples = item['examples']
                    # Find entity annotations like [entity](entity_type)
                    import re
                    entity_pattern = r'\[.*?\]\((.*?)\)'
                    found_entities = re.findall(entity_pattern, examples)
                    entities.extend(found_entities)
        
        intents = list(set(intents))
        entities = list(set(entities))
        
        return {
            "valid": True,
            "intents": intents,
            "entities": entities,
            "sample_count": sample_count,
            "errors": []
        }
    except Exception as e:
        return {"valid": False, "errors": [f"YAML parsing error: {str(e)}"]}

@app.post("/datasets/validate", response_model=DatasetValidationResponse)
async def validate_dataset(request: DatasetValidationRequest):
    """Validate uploaded dataset format and extract metadata"""
    
    # Convert relative URL path to absolute file system path
    # Next.js saves files to: <project_root>/public/uploads/datasets/
    # Python backend runs from: <project_root>/python-rasa-backend/
    # So we need to go up one level and then into public/
    file_path = request.file_path.lstrip('/')  # Remove leading slash
    file_path = os.path.join(os.path.dirname(os.getcwd()), file_path)
    
    if not os.path.exists(file_path):
        # Try alternative path (in case file is in public/)
        alt_path = os.path.join(os.path.dirname(os.getcwd()), "public", request.file_path.lstrip('/'))
        if os.path.exists(alt_path):
            file_path = alt_path
        else:
            raise HTTPException(
                status_code=404, 
                detail=f"File not found. Tried: {file_path} and {alt_path}"
            )
    
    # Validate based on format
    if request.format == 'csv':
        result = validate_csv_format(file_path)
    elif request.format == 'json':
        result = validate_json_format(file_path)
    elif request.format == 'rasa':
        result = validate_rasa_format(file_path)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {request.format}")
    
    # Update Next.js database with validation results
    try:
        async with aiohttp.ClientSession() as session:
            await session.patch(
                f"{NEXT_API_URL}/datasets/{request.dataset_id}",
                json={
                    "status": "validated" if result["valid"] else "error",
                    "intents": result.get("intents", []),
                    "entities": result.get("entities", []),
                    "sampleCount": result.get("sample_count", 0),
                    "errors": result.get("errors", []),
                }
            )
    except Exception as e:
        print(f"Failed to update Next.js DB: {e}")
    
    return DatasetValidationResponse(**result)

# ============================================================================
# MODEL TRAINING
# ============================================================================

async def train_model_task(training_job_id: int, file_path: str, format: str):
    """Background task for model training"""
    try:
        # Update status to "training"
        async with aiohttp.ClientSession() as session:
            await session.patch(
                f"{NEXT_API_URL}/training-jobs/{training_job_id}",
                json={"status": "training", "log": "Starting Rasa NLU training...\n"}
            )
        
        # Simulate training process (replace with actual Rasa training)
        for progress in [0.2, 0.4, 0.6, 0.8, 1.0]:
            await asyncio.sleep(5)  # Simulate training time
            
            log_message = f"Training progress: {int(progress * 100)}%\n"
            if progress == 0.2:
                log_message += "Loading training data...\n"
            elif progress == 0.4:
                log_message += "Training intent classifier...\n"
            elif progress == 0.6:
                log_message += "Training entity recognizer...\n"
            elif progress == 0.8:
                log_message += "Optimizing model...\n"
            elif progress == 1.0:
                log_message += "Training complete!\n"
            
            async with aiohttp.ClientSession() as session:
                await session.patch(
                    f"{NEXT_API_URL}/training-jobs/{training_job_id}",
                    json={
                        "status": "training",
                        "progress": progress,
                        "log": log_message
                    }
                )
        
        # Mark as completed
        model_path = f"/models/model_{training_job_id}_{int(datetime.now().timestamp())}.tar.gz"
        async with aiohttp.ClientSession() as session:
            await session.patch(
                f"{NEXT_API_URL}/training-jobs/{training_job_id}",
                json={
                    "status": "completed",
                    "progress": 1.0,
                    "modelPath": model_path,
                    "finishedAt": datetime.now().isoformat(),
                    "log": "Training completed successfully!"
                }
            )
        
    except Exception as e:
        # Mark as failed
        async with aiohttp.ClientSession() as session:
            await session.patch(
                f"{NEXT_API_URL}/training-jobs/{training_job_id}",
                json={
                    "status": "failed",
                    "log": f"Training failed: {str(e)}"
                }
            )

@app.post("/train")
async def train_model(request: TrainingRequest, background_tasks: BackgroundTasks):
    """Start model training process"""
    
    # Validate file exists
    file_path = os.path.join(os.getcwd(), "..", request.file_path.lstrip('/'))
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Training file not found: {file_path}")
    
    # Start training in background
    background_tasks.add_task(train_model_task, request.training_job_id, file_path, request.format)
    
    return {
        "message": "Training started",
        "training_job_id": request.training_job_id,
        "status": "training"
    }

# ============================================================================
# CHAT & NLU INFERENCE
# ============================================================================

@app.post("/chat")
async def chat_inference(request: ChatRequest):
    """Process chat message through Rasa NLU"""
    try:
        # Try to reach Rasa server
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{RASA_URL}/webhooks/rest/webhook",
                json={
                    "sender": request.sender,
                    "message": request.message,
                    "metadata": request.metadata
                },
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    rasa_response = await resp.json()
                    return {"responses": rasa_response}
    except Exception as e:
        print(f"Rasa unavailable: {e}")
    
    # Fallback response if Rasa is down
    return {
        "responses": [{
            "text": f"Echo: {request.message} (Rasa server unavailable, using fallback)"
        }]
    }

# ============================================================================
# HEALTH & INFO
# ============================================================================

@app.get("/")
async def root():
    return {
        "service": "EchoChat Backend",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "validation": "/datasets/validate",
            "training": "/train",
            "chat": "/chat"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    rasa_status = "unknown"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{RASA_URL}/", timeout=aiohttp.ClientTimeout(total=2)) as resp:
                rasa_status = "connected" if resp.status == 200 else "disconnected"
    except:
        rasa_status = "disconnected"
    
    return {
        "status": "healthy",
        "rasa_status": rasa_status,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)