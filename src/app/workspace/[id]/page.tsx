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
import { Textarea } from '@/components/ui/textarea';
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
  Sparkles,
  Tag,
  AlertCircle,
  PlayCircle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface Dataset {
  id: string;
  name: string;
  format: string;
  size: number;
  uploadedAt: string;
  status: 'processing' | 'ready' | 'error';
  intents: number;
  entities: number;
  examples: number;
}

interface TrainingJob {
  id: string;
  status: 'queued' | 'training' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  accuracy?: number;
  loss?: number;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  intent?: string;
  confidence?: number;
  entities?: Array<{ entity: string; value: string; start: number; end: number }>;
  timestamp: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<any>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [trainingJob, setTrainingJob] = useState<TrainingJob | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('datasets');

  // Mock data - replace with real API calls
  useEffect(() => {
    setWorkspace({
      id: workspaceId,
      name: 'Customer Support Bot',
      description: 'Training NLU model for customer service automation',
      createdAt: '2024-01-15',
      modelStatus: 'trained'
    });

    setDatasets([
      {
        id: '1',
        name: 'support_conversations.csv',
        format: 'CSV',
        size: 2048576,
        uploadedAt: '2024-01-20',
        status: 'ready',
        intents: 15,
        entities: 8,
        examples: 350
      }
    ]);

    setMessages([
      {
        id: '1',
        role: 'bot',
        text: 'Hello! I\'m ready to help. Ask me anything!',
        timestamp: new Date().toISOString()
      }
    ]);
  }, [workspaceId]);

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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);

      // Mock upload - replace with real API
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newDataset: Dataset = {
        id: Date.now().toString(),
        name: file.name,
        format: fileExt.toUpperCase().slice(1),
        size: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'processing',
        intents: 0,
        entities: 0,
        examples: 0
      };

      setDatasets(prev => [...prev, newDataset]);
      toast.success('Dataset uploaded successfully!');
      
      // Simulate processing
      setTimeout(() => {
        setDatasets(prev => prev.map(d => 
          d.id === newDataset.id 
            ? { ...d, status: 'ready', intents: 12, entities: 6, examples: 280 }
            : d
        ));
      }, 3000);

    } catch (error) {
      toast.error('Failed to upload dataset');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const startTraining = async () => {
    if (datasets.length === 0) {
      toast.error('Please upload a dataset first');
      return;
    }

    const job: TrainingJob = {
      id: Date.now().toString(),
      status: 'training',
      progress: 0,
      startedAt: new Date().toISOString()
    };

    setTrainingJob(job);
    toast.success('Training started!');

    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingJob(prev => {
        if (!prev) return null;
        const newProgress = Math.min(prev.progress + 10, 100);
        
        if (newProgress === 100) {
          clearInterval(interval);
          toast.success('Model trained successfully!');
          return {
            ...prev,
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            accuracy: 0.94,
            loss: 0.08
          };
        }
        
        return { ...prev, progress: newProgress };
      });
    }, 1000);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (!trainingJob || trainingJob.status !== 'completed') {
      toast.error('Please train the model first');
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
      // Mock bot response - replace with real API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: 'I understand you need help. Let me assist you with that!',
        intent: 'help_request',
        confidence: 0.87,
        entities: [
          { entity: 'request_type', value: 'help', start: 0, end: 4 }
        ],
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!workspace) {
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
                  <h1 className="text-2xl font-bold">{workspace.name}</h1>
                  <Badge variant={workspace.modelStatus === 'trained' ? 'default' : 'secondary'}>
                    {workspace.modelStatus === 'trained' ? 'Model Trained' : 'Not Trained'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{workspace.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Model
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
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
            <TabsTrigger value="annotate">
              <Tag className="h-4 w-4 mr-2" />
              Annotate
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
                      <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Uploaded Datasets</h3>
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
                            <Badge variant={
                              dataset.status === 'ready' ? 'default' :
                              dataset.status === 'processing' ? 'secondary' : 'destructive'
                            }>
                              {dataset.status === 'ready' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {dataset.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              {dataset.status === 'error' && <XCircle className="h-3 w-3 mr-1" />}
                              {dataset.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Format</p>
                              <p className="font-medium">{dataset.format}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Size</p>
                              <p className="font-medium">{formatFileSize(dataset.size)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Examples</p>
                              <p className="font-medium">{dataset.examples}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Intents</p>
                              <p className="font-medium">{dataset.intents}</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
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
                  Train your model using Rasa NLU framework with uploaded datasets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {datasets.filter(d => d.status === 'ready').length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      No datasets ready for training. Please upload a dataset first.
                    </p>
                    <Button onClick={() => setActiveTab('datasets')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Dataset
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Training Dataset</Label>
                        <p className="text-sm font-medium mt-2">
                          {datasets.find(d => d.status === 'ready')?.name}
                        </p>
                      </div>
                      <div>
                        <Label>Model Type</Label>
                        <p className="text-sm font-medium mt-2">Rasa NLU</p>
                      </div>
                    </div>

                    {trainingJob && trainingJob.status !== 'completed' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                            <span className="font-medium">Training in progress...</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {trainingJob.progress}%
                          </span>
                        </div>
                        <Progress value={trainingJob.progress} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                          This may take several minutes depending on your dataset size.
                        </p>
                      </div>
                    ) : trainingJob && trainingJob.status === 'completed' ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">Model trained successfully!</span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                              <p className="text-2xl font-bold text-green-600">
                                {((trainingJob.accuracy || 0) * 100).toFixed(1)}%
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-1">Loss</p>
                              <p className="text-2xl font-bold">
                                {(trainingJob.loss || 0).toFixed(3)}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                        <Button onClick={startTraining} variant="outline" className="w-full">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Retrain Model
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={startTraining} className="w-full" size="lg">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Training
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
                  Chat with your trained model and see NLU insights in real-time
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                          <p>{message.text}</p>
                        </div>
                        {message.intent && (
                          <div className="mt-2 space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Intent: {message.intent}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {(message.confidence! * 100).toFixed(1)}%
                              </Badge>
                            </div>
                            {message.entities && message.entities.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {message.entities.map((entity, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {entity.entity}: {entity.value}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
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
                      disabled={isSending || !trainingJob || trainingJob.status !== 'completed'}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={isSending || !inputMessage.trim() || !trainingJob || trainingJob.status !== 'completed'}
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {(!trainingJob || trainingJob.status !== 'completed') && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Train your model first to start chatting
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Annotate Tab */}
          <TabsContent value="annotate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Annotation Tool</CardTitle>
                <CardDescription>
                  Annotate intents, entities, and tokens to improve your model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Annotation interface coming soon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You'll be able to annotate intents, entities, and improve your model's accuracy
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
