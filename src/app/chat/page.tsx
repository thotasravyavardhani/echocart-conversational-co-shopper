"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, ArrowLeft, Bot, User, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  modelUsed?: boolean;
  intent?: string;
  confidence?: number;
  entities?: any[];
}

export default function ChatPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspace');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasTrainedModel, setHasTrainedModel] = useState(false);
  const [modelMetadata, setModelMetadata] = useState<any>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!workspaceId) {
      toast.error('No workspace selected');
      router.push('/dashboard');
    }
  }, [workspaceId, router]);

  // Check if workspace has trained model
  useEffect(() => {
    if (workspaceId) {
      checkTrainedModel();
    }
  }, [workspaceId]);

  const checkTrainedModel = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/training-jobs`);
      if (response.ok) {
        const jobs = await response.json();
        const completedJob = jobs.find((job: any) => job.status === 'completed');
        setHasTrainedModel(!!completedJob);
        
        // Fetch model metadata
        if (completedJob) {
          const metaResponse = await fetch('http://localhost:8000/model/metadata');
          if (metaResponse.ok) {
            const meta = await metaResponse.json();
            setModelMetadata(meta);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check training status:', error);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);
    setIsTyping(true);

    try {
      // Call Python backend directly for trained model responses
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: `user_${user?.id}_${sessionId}`,
          message: text,
          metadata: {
            user_id: user?.id,
            workspace_id: workspaceId,
            session_id: sessionId,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const botResponses = data.responses || [];

      // Process bot responses
      for (const botResponse of botResponses) {
        const botMessage: Message = {
          id: `bot_${Date.now()}_${Math.random()}`,
          sender: 'bot',
          text: botResponse.text || '',
          timestamp: new Date(),
          modelUsed: botResponse.metadata?.model_used || false,
          intent: botResponse.metadata?.intent,
          confidence: botResponse.metadata?.confidence,
          entities: botResponse.metadata?.entities || [],
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Save conversation to database
        await saveConversation(text, botMessage.text);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response
      const errorMessage: Message = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: "⚠️ Failed to connect to the Python backend.\n\nMake sure the backend is running:\n\n1. Open a terminal\n2. cd python-rasa-backend\n3. venv\\Scripts\\activate (Windows) or source venv/bin/activate (Mac/Linux)\n4. python app.py\n\nThe backend should start on http://localhost:8000",
        timestamp: new Date(),
        modelUsed: false,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to connect to AI backend');
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const saveConversation = async (userMessage: string, botResponse: string) => {
    try {
      await fetch('/api/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          workspaceId: parseInt(workspaceId || '0'),
          sessionId,
          message: userMessage,
          response: botResponse,
        }),
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/workspace/${workspaceId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workspace
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-indigo-600" />
              <div>
                <h1 className="text-lg font-bold">NLU Model Testing</h1>
                <p className="text-xs text-muted-foreground">Test your trained model</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant={hasTrainedModel ? "default" : "secondary"} className="gap-1">
              {hasTrainedModel ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Model Active
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  No Model
                </>
              )}
            </Badge>
            {modelMetadata && (
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {modelMetadata.intents?.length || 0} intents
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Training Status Banner */}
      {!hasTrainedModel && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  No Trained Model - Train a model first to get NLU responses
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Go to your workspace, upload a dataset, and train a model to test NLU capabilities here.
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-amber-300 dark:border-amber-700"
                onClick={() => router.push(`/workspace/${workspaceId}`)}
              >
                Go to Workspace
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="container mx-auto px-4 py-6 h-[calc(100vh-140px)] flex flex-col">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  {hasTrainedModel ? 'Start chatting to test your NLU model' : 'Train a model first to start testing'}
                </p>
                {modelMetadata && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p className="font-medium">Model Ready:</p>
                    <p>{modelMetadata.intents?.length || 0} intents • {modelMetadata.entities?.length || 0} entities • {modelMetadata.sample_count || 0} examples</p>
                  </div>
                )}
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && (
                  <Avatar className="h-8 w-8 bg-indigo-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </Avatar>
                )}
                
                <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-800 border'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    
                    {/* Show NLU metadata for bot messages */}
                    {message.sender === 'bot' && message.modelUsed && message.intent && (
                      <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-gray-700 space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          NLU Model Used
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <span className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {message.sender === 'user' && (
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </Avatar>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 bg-indigo-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </Avatar>
                <div className="bg-white dark:bg-gray-800 border rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="pt-4 border-t bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={hasTrainedModel ? "Test your NLU model..." : "Train a model first..."}
              disabled={isSending}
              className="flex-1"
            />
            <Button type="submit" disabled={isSending || !inputMessage.trim()}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {hasTrainedModel 
              ? '💡 Try different messages to see how the NLU model classifies intents and extracts entities'
              : '⚠️ No trained model available - train a model in your workspace first'
            }
          </p>
        </div>
      </main>
    </div>
  );
}