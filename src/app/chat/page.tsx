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
import { Loader2, Send, ArrowLeft, ShoppingCart, Heart, Sparkles, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  products?: Product[];
  sentiment?: string;
  mood?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  rating?: number;
  image_url?: string;
  sustainability_score?: number;
  relevance_score?: number;
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

  // Send initial greeting
  useEffect(() => {
    if (user && messages.length === 0) {
      sendMessage('hello', true);
    }
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string, isInitial = false) => {
    if (!text.trim() && !isInitial) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: isInitial ? '' : text,
      timestamp: new Date(),
    };

    if (!isInitial) {
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
    }
    
    setIsSending(true);
    setIsTyping(true);

    try {
      // Call our Next.js API route that forwards to Rasa
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: `user_${user?.id}_${sessionId}`,
          message: isInitial ? 'hello' : text,
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

      const botResponses = await response.json();

      // Process bot responses
      for (const botResponse of botResponses) {
        const botMessage: Message = {
          id: `bot_${Date.now()}_${Math.random()}`,
          sender: 'bot',
          text: botResponse.text || '',
          timestamp: new Date(),
          products: botResponse.products || [],
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Save conversation to database
        if (!isInitial) {
          await saveConversation(text, botMessage.text);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response
      const errorMessage: Message = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: "I'm having trouble connecting right now. Please make sure the Rasa server is running. Start it with:\n\n`cd python-rasa-backend/rasa && rasa run --enable-api --cors \"*\"`",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message');
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
                <h1 className="text-lg font-bold">EchoCart AI</h1>
                <p className="text-xs text-muted-foreground">Your conversational shopping assistant</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Workspace #{workspaceId}
          </Badge>
        </div>
      </header>

      {/* Chat Area */}
      <main className="container mx-auto px-4 py-6 h-[calc(100vh-140px)] flex flex-col">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
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
                
                <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {message.text && (
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 border'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    </div>
                  )}
                  
                  {/* Product Cards */}
                  {message.products && message.products.length > 0 && (
                    <div className="mt-2 space-y-2 w-full">
                      {message.products.map((product) => (
                        <Card key={product.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base">{product.name}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {product.description}
                                </CardDescription>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-lg font-bold text-indigo-600">
                                  ${product.price}
                                </p>
                                {product.rating && (
                                  <p className="text-xs text-muted-foreground">
                                    ⭐ {product.rating}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-2">
                              {product.sustainability_score && product.sustainability_score > 0.7 && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  🌱 Eco {(product.sustainability_score * 100).toFixed(0)}%
                                </Badge>
                              )}
                              {product.relevance_score && (
                                <Badge variant="outline" className="text-xs">
                                  {(product.relevance_score * 100).toFixed(0)}% match
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="flex-1">
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                Add to Cart
                              </Button>
                              <Button size="sm" variant="outline">
                                <Heart className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
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
              placeholder="Ask me anything... (e.g., 'I'm tired, show me cozy clothes' or 'Track my order')"
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
            💡 Try: "I'm tired, show me cozy clothes" or "eco-friendly products under $100"
          </p>
        </div>
      </main>
    </div>
  );
}