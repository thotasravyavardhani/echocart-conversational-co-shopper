"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Upload, Brain, TestTube, Database, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Upload,
      title: 'Upload Datasets',
      description: 'Support for CSV, JSON, and Rasa format files up to 500MB',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Brain,
      title: 'Train NLU Models',
      description: 'Train with Rasa NLU framework with real-time progress tracking',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: TestTube,
      title: 'Annotation Tool',
      description: 'Annotate intents, entities, and tokens with visual interface',
      color: 'from-orange-500 to-amber-500',
    },
    {
      icon: MessageSquare,
      title: 'Test Chatbot',
      description: 'Chat with your trained model and see NLU insights in real-time',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Create Workspace',
      description: 'Sign up and create your first workspace to organize your NLU projects',
      icon: Database,
    },
    {
      step: '02',
      title: 'Upload Dataset',
      description: 'Upload training data in CSV, JSON, or Rasa format',
      icon: Upload,
    },
    {
      step: '03',
      title: 'Train Model',
      description: 'Train your NLU model with Rasa and monitor progress in real-time',
      icon: Brain,
    },
    {
      step: '04',
      title: 'Test & Annotate',
      description: 'Chat with your bot, annotate responses, and refine your model',
      icon: TestTube,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              EchoChat
            </span>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="ghost">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4 px-4 py-2 text-sm" variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            NLU Chatbot Training Platform
          </Badge>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Train Your Own NLU Chatbot
          </h1>
          <p className="text-2xl mb-4 text-muted-foreground">
            Upload datasets, train models, and test chatbots
          </p>
          <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
            A complete platform for training conversational AI. Upload your data in CSV, JSON, or Rasa format,
            train NLU models with Rasa, annotate intents and entities, and chat with your trained bot—all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/register">
                Start Training Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-center mb-12">
            Everything You Need to Build NLU Chatbots
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="overflow-hidden hover:shadow-2xl transition-all group">
                <div className={`h-2 bg-gradient-to-r ${feature.color}`} />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl bg-gradient-to-r ${feature.color} p-3 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-center mb-12">How EchoChat Works</h2>
          <div className="space-y-6">
            {steps.map((item) => (
              <Card key={item.step} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="text-6xl font-bold text-indigo-100 dark:text-gray-800">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-2">
                          <item.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Build Your Chatbot?</h2>
            <p className="text-xl mb-8 text-white/90">
              Join developers training NLU models with our simple, powerful platform.
            </p>
            <Button size="lg" variant="secondary" className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6">
              <Link href="/register" className="flex items-center">
                Get Started Now
                <Sparkles className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                EchoChat
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 EchoChat. NLU Training Platform.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">Privacy</Link>
              <Link href="#" className="hover:text-foreground">Terms</Link>
              <Link href="#" className="hover:text-foreground">Docs</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}