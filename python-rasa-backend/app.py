"""
EchoChat FastAPI Backend - Dataset Processing & NLU Training
Handles CSV/JSON/Rasa format datasets and Rasa NLU model training
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import csv
import yaml
import os
from datetime import datetime
import asyncio
import aiohttp
import subprocess
import shutil

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
MODELS_DIR = os.path.join(os.path.dirname(os.getcwd()), "models")
ANNOTATIONS_DIR = os.path.join(os.path.dirname(os.getcwd()), "annotations")
RASA_TRAINING_DIR = os.path.join(os.path.dirname(__file__), "rasa_training")

# Ensure directories exist
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(ANNOTATIONS_DIR, exist_ok=True)
os.makedirs(RASA_TRAINING_DIR, exist_ok=True)

# Track the latest trained model for chatbot use
latest_model_path = None
latest_model_metadata = None
rasa_agent = None  # Store loaded Rasa agent
intent_responses = {}  # Store intent -> response mapping from training data

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

class EntityAnnotation(BaseModel):
    start: int
    end: int
    entity: str
    value: str

class AnnotationRequest(BaseModel):
    workspace_id: int
    text: str
    intent: str
    entities: List[EntityAnnotation]

class TokenizeRequest(BaseModel):
    text: str

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
    file_path = request.file_path.lstrip('/')
    file_path = os.path.join(os.path.dirname(os.getcwd()), file_path)
    
    if not os.path.exists(file_path):
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
# RASA NLU TRAINING (REAL IMPLEMENTATION)
# ============================================================================

def convert_to_rasa_format(file_path: str, format: str, output_path: str) -> Dict[str, Any]:
    """Convert dataset to Rasa NLU format and extract responses"""
    global intent_responses
    
    try:
        nlu_data = []
        intent_responses = {}  # Reset responses
        
        if format == 'json':
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                data = [data]
            
            # Group by intent and extract responses
            intent_examples = {}
            for item in data:
                intent = item.get('intent', 'unknown')
                text = item.get('text', '')
                response = item.get('response', '')  # Extract response
                entities = item.get('entities', [])
                
                if intent not in intent_examples:
                    intent_examples[intent] = []
                
                # Store response for this intent
                if response and intent not in intent_responses:
                    intent_responses[intent] = response
                
                # Format with entity annotations
                if entities:
                    # Sort entities by start position
                    entities.sort(key=lambda x: x.get('start', 0))
                    annotated_text = text
                    offset = 0
                    for entity in entities:
                        start = entity.get('start', 0) + offset
                        end = entity.get('end', 0) + offset
                        entity_type = entity.get('entity', 'unknown')
                        entity_value = text[entity.get('start', 0):entity.get('end', 0)]
                        annotation = f"[{entity_value}]({entity_type})"
                        annotated_text = annotated_text[:start] + annotation + annotated_text[end:]
                        offset += len(annotation) - (entity.get('end', 0) - entity.get('start', 0))
                    intent_examples[intent].append(f"- {annotated_text}")
                else:
                    intent_examples[intent].append(f"- {text}")
            
            # Create Rasa format
            for intent, examples in intent_examples.items():
                nlu_data.append({
                    'intent': intent,
                    'examples': '\n'.join(examples)
                })
        
        elif format == 'csv':
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            
            intent_examples = {}
            for row in rows:
                intent = row.get('intent', 'unknown')
                text = row.get('text', '')
                response = row.get('response', '')
                
                if intent not in intent_examples:
                    intent_examples[intent] = []
                
                # Store response for this intent
                if response and intent not in intent_responses:
                    intent_responses[intent] = response
                
                intent_examples[intent].append(f"- {text}")
            
            for intent, examples in intent_examples.items():
                nlu_data.append({
                    'intent': intent,
                    'examples': '\n'.join(examples)
                })
        
        elif format == 'rasa':
            # Already in Rasa format, just copy
            shutil.copy(file_path, output_path)
            
            # Try to extract responses from domain or responses section
            with open(file_path, 'r', encoding='utf-8') as f:
                rasa_data = yaml.safe_load(f)
            
            if 'responses' in rasa_data:
                for intent, response_list in rasa_data['responses'].items():
                    if response_list and len(response_list) > 0:
                        intent_responses[intent] = response_list[0].get('text', '')
            
            return validate_rasa_format(file_path)
        
        # Write to YAML
        rasa_yaml = {'version': '3.1', 'nlu': nlu_data}
        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(rasa_yaml, f, allow_unicode=True, sort_keys=False)
        
        print(f"✅ Extracted {len(intent_responses)} intent responses from training data")
        return validate_rasa_format(output_path)
        
    except Exception as e:
        raise Exception(f"Conversion failed: {str(e)}")

async def train_rasa_model(training_data_path: str, model_name: str) -> str:
    """Train actual Rasa NLU model"""
    try:
        # Create config.yml for NLU-only training
        config = """
language: en
pipeline:
  - name: WhitespaceTokenizer
  - name: RegexFeaturizer
  - name: LexicalSyntacticFeaturizer
  - name: CountVectorsFeaturizer
  - name: CountVectorsFeaturizer
    analyzer: char_wb
    min_ngram: 1
    max_ngram: 4
  - name: DIETClassifier
    epochs: 100
    constrain_similarities: true
  - name: EntitySynonymMapper
  - name: ResponseSelector
    epochs: 100
    constrain_similarities: true
  - name: FallbackClassifier
    threshold: 0.3
    ambiguity_threshold: 0.1

policies:
  - name: MemoizationPolicy
  - name: RulePolicy
"""
        
        config_path = os.path.join(RASA_TRAINING_DIR, 'config.yml')
        with open(config_path, 'w') as f:
            f.write(config)
        
        # Create domain.yml
        with open(training_data_path, 'r', encoding='utf-8') as f:
            training_data = yaml.safe_load(f)
        
        intents = []
        if 'nlu' in training_data:
            intents = [item['intent'] for item in training_data['nlu'] if 'intent' in item]
        
        domain = {
            'version': '3.1',
            'intents': intents,
            'responses': {},
            'session_config': {
                'session_expiration_time': 60,
                'carry_over_slots_to_new_session': True
            }
        }
        
        domain_path = os.path.join(RASA_TRAINING_DIR, 'domain.yml')
        with open(domain_path, 'w') as f:
            yaml.dump(domain, f)
        
        # Create data directory
        data_dir = os.path.join(RASA_TRAINING_DIR, 'data')
        os.makedirs(data_dir, exist_ok=True)
        shutil.copy(training_data_path, os.path.join(data_dir, 'nlu.yml'))
        
        # Train with Rasa
        output_dir = os.path.join(MODELS_DIR, model_name)
        os.makedirs(output_dir, exist_ok=True)
        
        cmd = [
            'rasa', 'train', 'nlu',
            '--config', config_path,
            '--domain', domain_path,
            '--data', data_dir,
            '--out', output_dir,
            '--fixed-model-name', model_name
        ]
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=RASA_TRAINING_DIR
        )
        
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"Rasa training failed: {stderr}")
        
        model_path = os.path.join(output_dir, f"{model_name}.tar.gz")
        
        if not os.path.exists(model_path):
            # Check for model in output directory
            model_files = [f for f in os.listdir(output_dir) if f.endswith('.tar.gz')]
            if model_files:
                model_path = os.path.join(output_dir, model_files[0])
        
        return model_path
        
    except Exception as e:
        raise Exception(f"Rasa training error: {str(e)}")

async def load_rasa_agent(model_path: str):
    """Load trained Rasa agent for inference"""
    global rasa_agent
    try:
        from rasa.core.agent import Agent
        rasa_agent = await Agent.load(model_path)
        print(f"✅ Rasa agent loaded from: {model_path}")
    except Exception as e:
        print(f"Failed to load Rasa agent: {e}")
        rasa_agent = None

async def train_model_task(training_job_id: int, dataset_id: int, file_path: str, format: str):
    """Background task for REAL Rasa NLU training"""
    global latest_model_path, latest_model_metadata, rasa_agent
    
    try:
        # Update status to "training"
        async with aiohttp.ClientSession() as session:
            await session.patch(
                f"{NEXT_API_URL}/training-jobs/{training_job_id}",
                json={"status": "training", "log": "🚀 Starting Rasa NLU training...\n"}
            )
        
        log_messages = []
        
        # Step 1: Convert to Rasa format (20%)
        await asyncio.sleep(1)
        log_messages.append("📋 Converting dataset to Rasa NLU format...")
        
        abs_file_path = os.path.join(os.path.dirname(os.getcwd()), file_path.lstrip('/'))
        if not os.path.exists(abs_file_path):
            abs_file_path = os.path.join(os.path.dirname(os.getcwd()), "public", file_path.lstrip('/'))
        
        rasa_data_path = os.path.join(RASA_TRAINING_DIR, f'training_data_{training_job_id}.yml')
        metadata = convert_to_rasa_format(abs_file_path, format, rasa_data_path)
        
        log_messages.append(f"   ✓ Found {len(metadata.get('intents', []))} intents and {len(metadata.get('entities', []))} entity types")
        
        async with aiohttp.ClientSession() as session:
            await session.patch(
                f"{NEXT_API_URL}/training-jobs/{training_job_id}",
                json={
                    "status": "training",
                    "progress": 0.2,
                    "log": "\n".join(log_messages)
                }
            )
        
        # Step 2: Train Rasa model (80%)
        log_messages.append("🎯 Training Rasa NLU model (this may take a few minutes)...")
        log_messages.append("   └─ Using DIET algorithm for intent classification")
        log_messages.append("   └─ Training entity extraction with CRF")
        
        async with aiohttp.ClientSession() as session:
            await session.patch(
                f"{NEXT_API_URL}/training-jobs/{training_job_id}",
                json={
                    "status": "training",
                    "progress": 0.4,
                    "log": "\n".join(log_messages)
                }
            )
        
        model_name = f"model_{training_job_id}_{int(datetime.now().timestamp())}"
        model_path = await train_rasa_model(rasa_data_path, model_name)
        
        log_messages.append(f"💾 Model saved: {model_name}.tar.gz")
        
        async with aiohttp.ClientSession() as session:
            await session.patch(
                f"{NEXT_API_URL}/training-jobs/{training_job_id}",
                json={
                    "status": "training",
                    "progress": 0.9,
                    "log": "\n".join(log_messages)
                }
            )
        
        # Step 3: Load model for inference
        log_messages.append("🔄 Loading trained model for inference...")
        await load_rasa_agent(model_path)
        
        latest_model_path = model_path
        latest_model_metadata = {
            "intents": metadata.get('intents', []),
            "entities": metadata.get('entities', []),
            "sample_count": metadata.get('sample_count', 0),
            "trained_at": datetime.now().isoformat(),
            "model_name": model_name
        }
        
        log_messages.append("✅ Training completed! Model ready for chatbot use.")
        
        # Mark as completed
        async with aiohttp.ClientSession() as session:
            await session.patch(
                f"{NEXT_API_URL}/training-jobs/{training_job_id}",
                json={
                    "status": "completed",
                    "progress": 1.0,
                    "modelPath": f"/models/{model_name}/{model_name}.tar.gz",
                    "finishedAt": datetime.now().isoformat(),
                    "log": "\n".join(log_messages)
                }
            )
        
        print(f"✅ Training job {training_job_id} completed successfully")
        
    except Exception as e:
        error_message = f"❌ Training failed: {str(e)}"
        print(error_message)
        
        try:
            async with aiohttp.ClientSession() as session:
                await session.patch(
                    f"{NEXT_API_URL}/training-jobs/{training_job_id}",
                    json={
                        "status": "failed",
                        "log": error_message
                    }
                )
        except Exception as update_error:
            print(f"Failed to update job status: {update_error}")

@app.post("/train")
async def train_model(request: TrainingRequest, background_tasks: BackgroundTasks):
    """Start REAL Rasa NLU training"""
    
    file_path = request.file_path.lstrip('/')
    abs_file_path = os.path.join(os.path.dirname(os.getcwd()), file_path)
    
    if not os.path.exists(abs_file_path):
        alt_path = os.path.join(os.path.dirname(os.getcwd()), "public", file_path)
        if os.path.exists(alt_path):
            abs_file_path = alt_path
        else:
            raise HTTPException(
                status_code=404, 
                detail=f"Training file not found: {file_path}"
            )
    
    background_tasks.add_task(
        train_model_task, 
        request.training_job_id, 
        request.dataset_id,
        abs_file_path, 
        request.format
    )
    
    return {
        "message": "Training started",
        "training_job_id": request.training_job_id,
        "status": "training"
    }

# ============================================================================
# CHAT & NLU INFERENCE (REAL RASA)
# ============================================================================

@app.post("/chat")
async def chat_inference(request: ChatRequest):
    """Process chat with REAL Rasa NLU model and return training data responses"""
    global latest_model_path, latest_model_metadata, rasa_agent, intent_responses
    
    # Try to use Rasa agent if loaded
    if rasa_agent and intent_responses:
        try:
            result = await rasa_agent.parse_message(request.message)
            
            intent = result.get('intent', {})
            entities = result.get('entities', [])
            
            intent_name = intent.get('name', 'unknown')
            confidence = intent.get('confidence', 0.0)
            
            # Get the response from training data
            bot_response = intent_responses.get(intent_name, 
                f"I detected the intent '{intent_name}' but no response was defined in the training data.")
            
            # Add entity information if entities were detected
            if entities:
                entity_info = "\n\n**Detected Entities:**\n"
                for entity in entities:
                    entity_type = entity.get('entity', 'unknown')
                    entity_value = entity.get('value', '')
                    entity_info += f"• {entity_type}: \"{entity_value}\"\n"
                bot_response += entity_info
            
            return {
                "responses": [{
                    "text": bot_response,
                    "metadata": {
                        "model_used": True,
                        "model_path": latest_model_path,
                        "intent": intent_name,
                        "confidence": confidence,
                        "entities": entities,
                        "model_metadata": latest_model_metadata
                    }
                }]
            }
            
        except Exception as e:
            print(f"Rasa inference error: {e}")
    
    # Fallback if no model
    return {
        "responses": [{
            "text": f"⚠️ **No Trained Model Available**\n\n**Your Input:** \"{request.message}\"\n\nTo get responses from your trained dataset:\n\n1. Go to your workspace\n2. Upload a training dataset (CSV/JSON/YAML) with 'text', 'intent', and 'response' columns\n3. Train a model with your data\n4. Come back here to test it!\n\nCurrently responding in echo mode without NLU capabilities.",
            "metadata": {
                "model_used": False
            }
        }]
    }

# ============================================================================
# MODEL EXPORT
# ============================================================================

@app.get("/models/export/{model_name}")
async def export_model(model_name: str):
    """Export trained model file"""
    global latest_model_path
    
    if not latest_model_path or not os.path.exists(latest_model_path):
        raise HTTPException(status_code=404, detail="No trained model available")
    
    return FileResponse(
        latest_model_path,
        media_type='application/gzip',
        filename=f"{model_name}.tar.gz"
    )

# ============================================================================
# ANNOTATION TOOL
# ============================================================================

@app.post("/annotations/save")
async def save_annotation(request: AnnotationRequest):
    """Save a manually annotated training example"""
    
    annotation_file = os.path.join(ANNOTATIONS_DIR, f"workspace_{request.workspace_id}.jsonl")
    
    annotation_entry = {
        "text": request.text,
        "intent": request.intent,
        "entities": [
            {
                "start": ent.start,
                "end": ent.end,
                "entity": ent.entity,
                "value": ent.value
            }
            for ent in request.entities
        ],
        "annotated_at": datetime.now().isoformat()
    }
    
    with open(annotation_file, 'a', encoding='utf-8') as f:
        f.write(json.dumps(annotation_entry) + '\n')
    
    return {
        "message": "Annotation saved successfully",
        "annotation": annotation_entry
    }

@app.get("/annotations/{workspace_id}")
async def get_annotations(workspace_id: int):
    """Get all saved annotations for a workspace"""
    
    annotation_file = os.path.join(ANNOTATIONS_DIR, f"workspace_{workspace_id}.jsonl")
    
    if not os.path.exists(annotation_file):
        return {"annotations": []}
    
    annotations = []
    with open(annotation_file, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                annotations.append(json.loads(line))
    
    return {"annotations": annotations}

@app.post("/tokenize")
async def tokenize_text(request: TokenizeRequest):
    """Tokenize text into words/tokens"""
    
    tokens = request.text.split()
    
    return {
        "text": request.text,
        "tokens": [
            {
                "text": token,
                "start": request.text.index(token),
                "end": request.text.index(token) + len(token)
            }
            for token in tokens
        ]
    }

@app.get("/model/metadata")
async def get_model_metadata():
    """Get metadata about the currently loaded model"""
    global latest_model_path, latest_model_metadata
    
    if not latest_model_path or not os.path.exists(latest_model_path):
        raise HTTPException(status_code=404, detail="No trained model available")
    
    return latest_model_metadata or {
        "message": "Model loaded but metadata unavailable"
    }

@app.get("/")
async def root():
    return {
        "service": "EchoChat Backend",
        "version": "1.0.0",
        "status": "running",
        "rasa_enabled": rasa_agent is not None,
        "endpoints": {
            "validation": "/datasets/validate",
            "training": "/train",
            "chat": "/chat",
            "annotations": "/annotations/save",
            "tokenize": "/tokenize",
            "export": "/models/export/{model_name}"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "rasa_loaded": rasa_agent is not None,
        "model_loaded": latest_model_path is not None,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)