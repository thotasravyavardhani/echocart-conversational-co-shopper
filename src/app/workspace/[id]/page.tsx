"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Brain, 
  Upload, 
  MessageSquare, 
  Database, 
  Settings, 
  ChevronLeft,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
  Tag,
  AlertCircle,
  PlayCircle,
  Download,
  RefreshCw,
  Sparkles,
  List
} from 'lucide-react';
import { toast } from 'sonner';

interface Dataset {
  id: number;
  workspaceId: number;
  name: string;
  format: string;
  fileUrl: string;
  status: string;
  intents: string[];
  entities: string[];
  sampleCount: number;
  validationReport?: { errors?: string[] };
  uploadedAt: string;
}

interface TrainingJob {
  id: number;
  workspaceId: number;
  datasetId: number;
  status: string;
  progress: number;
  log: string | null;
  modelPath: string | null;
  createdAt: string;
  finishedAt: string | null;
}

interface ModelMetadata {
  intents: string[];
  entities: string[];
  sample_count: number;
  trained_at: string;
  model_name: string;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  products?: any[];
  timestamp: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<any>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [currentTrainingJob, setCurrentTrainingJob] = useState<TrainingJob | null>(null);
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('datasets');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch workspace data
  useEffect(() => {
    fetchWorkspace();
    fetchDatasets();
    fetchTrainingJobs();
  }, [workspaceId]);

  // Poll training job status
  useEffect(() => {
    if (currentTrainingJob && (currentTrainingJob.status === 'queued' || currentTrainingJob.status === 'training')) {
      const interval = setInterval(() => {
        fetchTrainingJobStatus(currentTrainingJob.id);
      }, 2000);
      setPollingInterval(interval);
      return () => clearInterval(interval);
    } else if (currentTrainingJob && currentTrainingJob.status === 'completed') {
      // Fetch model metadata when training completes
      fetchModelMetadata();
    }
  }, [currentTrainingJob]);

  const fetchWorkspace = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkspace(data);
      }
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
    }
  };

  const fetchDatasets = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/workspaces/${workspaceId}/datasets`);
      if (response.ok) {
        const data = await response.json();
        setDatasets(data);
      }
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    } finally {
      setIsLoadingData(false);
      setIsRefreshing(false);
    }
  };

  const fetchTrainingJobs = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/training-jobs`);
      if (response.ok) {
        const data = await response.json();
        setTrainingJobs(data);
        // Get the latest training job
        if (data.length > 0) {
          const latest = data[0];
          setCurrentTrainingJob(latest);
        }
      }
    } catch (error) {
      console.error('Failed to fetch training jobs:', error);
    }
  };

  const fetchTrainingJobStatus = async (jobId: number) => {
    try {
      const response = await fetch(`/api/training-jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentTrainingJob(data);
        
        if (data.status === 'completed' || data.status === 'failed') {
          
          if (data.status === 'completed') {
            toast.success('Model trained successfully!');
            fetchDatasets(); // Refresh datasets
            await reloadModel();
            fetchModelMetadata(); // Fetch model metadata
          } else {
            toast.error('Training failed');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch training job status:', error);
    }
  };

  const fetchModelMetadata = async () => {
    try {
      const response = await fetch('http://localhost:8000/model/metadata');
      if (response.ok) {
        const data = await response.json();
        setModelMetadata(data);
      }
    } catch (error) {
      console.log('Model metadata not available yet');
    }
  };

  const reloadModel = async () => {
   try {
      console.log('Initiating Rasa model reload via FastAPI...');
      // Call a new endpoint on your FastAPI server (on port 8000)
      const response = await fetch('http://localhost:8000/reload-rasa-model', {
        method: 'POST',
      });
      if (response.ok) {
        toast.success('Model reload initiated. New model should be live shortly.');
      } else {
        throw new Error('Failed to communicate model reload request to backend.');
      }
    } catch (error) {
      console.error('Failed to trigger Rasa model reload:', error);
      toast.error('Failed to reload trained model for chat. Check backend logs.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File size must be less than 500MB');
      return;
    }

    // Validate file format
    const allowedFormats = ['.csv', '.json', '.yml', '.yaml'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedFormats.includes(fileExt)) {
      toast.error('Supported formats: CSV, JSON, Rasa YAML');
      return;
    }

    setIsUploading(true);
    
    try {
      // Get user from localStorage
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      
      if (!storedUser || !accessToken) {
        toast.error('Please login first');
        router.push('/login');
        return;
      }

      const user = JSON.parse(storedUser);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      formData.append('userId', user.id.toString());

      const response = await fetch('/api/datasets/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      toast.success('Dataset uploaded successfully! Validating...');
      
      // Wait a moment for validation to complete, then refresh
      setTimeout(() => {
        fetchDatasets();
      }, 8000); // 8 second delay to allow validation to complete

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload dataset');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const startTraining = async () => {
    if (!selectedDatasetId) {
      toast.error('Please select a dataset to train');
      return;
    }

    const selectedDataset = datasets.find(d => d.id === selectedDatasetId);
    
    if (!selectedDataset || selectedDataset.status !== 'validated') {
      toast.error('Selected dataset must be validated first');
      return;
    }

    try {
      const response = await fetch(`/api/datasets/${selectedDatasetId}/train`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Training failed to start');
      }

      const result = await response.json();
      toast.success('Training started!');
      
      setCurrentTrainingJob(result.training_job);
      fetchTrainingJobs();

    } catch (error) {
      console.error('Training error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start training');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    if (!currentTrainingJob || currentTrainingJob.status !== 'completed') {
      toast.error('Please train a model first before testing');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          sender: `workspace_${workspaceId}_user`,
          metadata: { workspace_id: workspaceId }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const botResponses = await response.json();
      
      for (const botResponse of botResponses) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: botResponse.text || '',
          products: botResponse.products || [],
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      'validated': { variant: 'default', icon: CheckCircle2 },
      'uploaded': { variant: 'secondary', icon: Loader2 },
      'error': { variant: 'destructive', icon: XCircle },
      'pending': { variant: 'secondary', icon: Loader2 },
    };

    const config = statusConfig[status] || { variant: 'secondary', icon: Loader2 };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-indigo-600" />
                  <h1 className="text-2xl font-bold">{workspace?.name || 'Workspace'}</h1>
                  <Badge variant={currentTrainingJob?.status === 'completed' ? 'default' : 'secondary'}>
                    {currentTrainingJob?.status === 'completed' ? 'Model Trained' : 'Not Trained'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{workspace?.description || 'NLU Training Workspace'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/workspace/${workspaceId}/annotate`}>
                  <Tag className="h-4 w-4 mr-2" />
                  Annotate
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              {currentTrainingJob?.modelPath && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Model
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="datasets">
              <Database className="h-4 w-4 mr-2" />
              Datasets
            </TabsTrigger>
            <TabsTrigger value="training">
              <Brain className="h-4 w-4 mr-2" />
              Training
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Test Chat
            </TabsTrigger>
          </TabsList>

          {/* Datasets Tab */}
          <TabsContent value="datasets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Training Data</CardTitle>
                <CardDescription>
                  Upload your training data in CSV, JSON, or Rasa YAML format (max 500MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <p className="text-lg font-medium mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CSV, JSON, or Rasa YAML (max 500MB)
                    </p>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.json,.yml,.yaml"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  {isUploading && (
                    <div className="mt-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                      <p className="text-sm text-muted-foreground mt-2">Uploading and validating...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Uploaded Datasets</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchDatasets}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              {datasets.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No datasets uploaded yet</p>
                  </CardContent>
                </Card>
              ) : (
                datasets.map(dataset => (
                  <Card key={dataset.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-5 w-5 text-indigo-600" />
                            <h4 className="font-semibold">{dataset.name}</h4>
                            {getStatusBadge(dataset.status)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Format</p>
                              <p className="font-medium">{dataset.format.toUpperCase()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Examples</p>
                              <p className="font-medium">{dataset.sampleCount || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Intents</p>
                              <p className="font-medium">{dataset.intents?.length || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Entities</p>
                              <p className="font-medium">{dataset.entities?.length || 0}</p>
                            </div>
                          </div>
                          {dataset.status === 'error' && dataset.validationReport?.errors && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Validation Errors:</p>
                              <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                                {dataset.validationReport.errors.map((error, idx) => (
                                  <li key={idx}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Train NLU Model</CardTitle>
                <CardDescription>
                  Select a validated dataset and train your model using Rasa NLU framework
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {datasets.filter(d => d.status === 'validated').length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      No validated datasets available. Please upload a dataset first.
                    </p>
                    <Button onClick={() => setActiveTab('datasets')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Dataset
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label className="text-base font-semibold mb-4 block">Select Dataset for Training</Label>
                      <RadioGroup value={selectedDatasetId?.toString()} onValueChange={(val) => setSelectedDatasetId(parseInt(val))}>
                        <div className="space-y-3">
                          {datasets.filter(d => d.status === 'validated').map(dataset => (
                            <div key={dataset.id} className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                              <RadioGroupItem value={dataset.id.toString()} id={`dataset-${dataset.id}`} />
                              <Label htmlFor={`dataset-${dataset.id}`} className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{dataset.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {dataset.sampleCount} examples • {dataset.intents?.length || 0} intents • {dataset.entities?.length || 0} entities
                                    </p>
                                  </div>
                                  <Badge variant="default">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Validated
                                  </Badge>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>

                    {currentTrainingJob && (currentTrainingJob.status === 'queued' || currentTrainingJob.status === 'training') ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                            <span className="font-medium">Training in progress...</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((currentTrainingJob.progress || 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(currentTrainingJob.progress || 0) * 100} className="h-2" />
                        {currentTrainingJob.log && (
                          <div className="bg-muted p-4 rounded-md">
                            <pre className="text-xs whitespace-pre-wrap">{currentTrainingJob.log}</pre>
                          </div>
                        )}
                      </div>
                    ) : currentTrainingJob && currentTrainingJob.status === 'completed' ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">Model trained successfully!</span>
                        </div>
                        
                        {/* Model Metadata Card */}
                        {modelMetadata && (
                          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Sparkles className="h-5 w-5 text-green-600" />
                                Trained Model Metadata
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Model Name</p>
                                  <p className="font-medium text-sm">{modelMetadata.model_name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Training Examples</p>
                                  <p className="font-medium text-sm">{modelMetadata.sample_count}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Intents</p>
                                  <p className="font-medium text-sm">{modelMetadata.intents.length}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Entity Types</p>
                                  <p className="font-medium text-sm">{modelMetadata.entities.length}</p>
                                </div>
                              </div>
                              
                              {/* Intents List */}
                              <div>
                                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                  <Brain className="h-4 w-4" />
                                  Learned Intents ({modelMetadata.intents.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {modelMetadata.intents.map((intent, idx) => (
                                    <Badge key={idx} variant="secondary">
                                      {intent}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Entities List */}
                              {modelMetadata.entities.length > 0 && (
                                <div>
                                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    Entity Types ({modelMetadata.entities.length}):
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {modelMetadata.entities.map((entity, idx) => (
                                      <Badge key={idx} variant="outline">
                                        {entity}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                  Trained: {new Date(modelMetadata.trained_at).toLocaleString()}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        <div className="bg-muted p-4 rounded-md">
                          <p className="text-sm"><strong>Model Path:</strong> {currentTrainingJob.modelPath}</p>
                          <p className="text-sm mt-2"><strong>Completed:</strong> {new Date(currentTrainingJob.finishedAt!).toLocaleString()}</p>
                        </div>
                        <Button onClick={startTraining} variant="outline" className="w-full" disabled={!selectedDatasetId}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Retrain Model
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={startTraining} className="w-full" size="lg" disabled={!selectedDatasetId}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {selectedDatasetId ? 'Start Training' : 'Select a Dataset First'}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle>Test Your Chatbot</CardTitle>
                <CardDescription>
                  Chat with your trained model and see responses in real-time
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Start chatting to test your model</p>
                    </div>
                  )}
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      disabled={isSending || !currentTrainingJob || currentTrainingJob.status !== 'completed'}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={isSending || !inputMessage.trim() || !currentTrainingJob || currentTrainingJob.status !== 'completed'}
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {(!currentTrainingJob || currentTrainingJob.status !== 'completed') && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Train your model first to start chatting
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}