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
import { Loader2, Send, ArrowLeft, Sparkles, Bot, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  metadata?: {
    model_used?: boolean;
    intent?: string;
    confidence?: number;
    entities?: any[];
    model_metadata?: any;
  };
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
      text: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);
    setIsTyping(true);

    try {
      // Call Python backend directly for NLU responses
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
        throw new Error('Failed to get response from AI backend');
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
          metadata: botResponse.metadata || {},
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Save conversation to database
        await saveConversation(text, botMessage.text);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response with setup instructions
      const errorMessage: Message = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: "⚠️ **Unable to Connect to Python Backend**\n\nI'm having trouble connecting to the AI backend. Please make sure:\n\n**1. Python Backend is Running:**\n```\ncd python-rasa-backend\nvenv\\Scripts\\activate  (Windows)\nsource venv/bin/activate  (Mac/Linux)\npython app.py\n```\n\n**2. Backend URL is Correct:**\nShould be running on `http://localhost:8000`\n\n**3. Model is Trained:**\nGo to your workspace → Training tab → Train a model with your dataset\n\nOnce the backend is running, refresh this page and try again!",
        timestamp: new Date(),
        metadata: { model_used: false },
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
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-indigo-600" />
              <div>
                <h1 className="text-lg font-bold">Test Your NLU Model</h1>
                <p className="text-xs text-muted-foreground">Chat with your trained model and see NLU responses with intent classification</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant={hasTrainedModel ? "default" : "secondary"} className="gap-1">
              {hasTrainedModel ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Trained Model Active
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  No Model Trained
                </>
              )}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Workspace #{workspaceId}
            </Badge>
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
                  ⚠️ **No Trained Model Available**
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  **Your Input:** "{inputMessage || 'Hi'}"
                  <br /><br />
                  To get NLU-powered responses with intent classification and entity extraction:
                  <br />
                  1. Go to your workspace
                  <br />
                  2. Upload a training dataset (CSV/JSON/YAML)
                  <br />
                  3. Train a model with your data
                  <br />
                  4. Come back here to test it!
                  <br /><br />
                  Currently responding in echo mode without NLU capabilities.
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-amber-300 dark:border-amber-700"
                onClick={() => router.push(`/workspace/${workspaceId}`)}
              >
                Train Model
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="container mx-auto px-4 py-6 h-[calc(100vh-140px)] flex flex-col">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="h-16 w-16 mx-auto mb-4 text-indigo-600" />
                <h2 className="text-xl font-bold mb-2">Test Your NLU Model</h2>
                <p className="text-muted-foreground mb-4">
                  {hasTrainedModel 
                    ? "Your trained model is ready! Start chatting to see intent classification and entity extraction."
                    : "Train a model first to test NLU capabilities with intent detection and entity recognition."
                  }
                </p>
                {hasTrainedModel && (
                  <div className="bg-muted rounded-lg p-4 max-w-md mx-auto text-sm text-left">
                    <p className="font-semibold mb-2">Try these examples:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• "Hello" → Test greeting intent</li>
                      <li>• "I'm tired" → Test mood detection</li>
                      <li>• "Show me products under $50" → Test entity extraction</li>
                      <li>• "Track my order" → Test order tracking intent</li>
                    </ul>
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
                  <Avatar className="h-8 w-8 bg-indigo-600 flex items-center justify-center flex-shrink-0">
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
                    {message.sender === 'bot' && message.metadata?.model_used && (
                      <Badge variant="secondary" className="mt-3 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        ✅ This is an NLU-powered response from your trained model!
                      </Badge>
                    )}
                  </div>
                  
                  <span className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {message.sender === 'user' && (
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
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
              placeholder={hasTrainedModel 
                ? "Type your message to test NLU... (e.g., 'I'm tired' or 'show products under $50')" 
                : "Train a model first to test NLU capabilities..."
              }
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
              ? "💡 Your trained model will classify intents and extract entities from your messages"
              : "⚠️ No trained model - Go to your workspace to train a model first"
            }
          </p>
        </div>
      </main>
    </div>
  );
}