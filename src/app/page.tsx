"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Package, TrendingUp, Users, Leaf, Sparkles, ShoppingCart, Zap, Heart, Star } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: MessageSquare,
      title: 'AI Chat Assistant',
      description: 'Emotion-aware conversations that understand your mood and preferences',
      color: 'from-blue-500 to-cyan-500',
      highlight: 'Visual Search',
    },
    {
      icon: Package,
      title: 'Smart Product Catalog',
      description: 'Discover products with sustainability scoring and story mode',
      color: 'from-green-500 to-emerald-500',
      highlight: '98% Eco Score',
    },
    {
      icon: TrendingUp,
      title: 'Predictive Tracking',
      description: 'AI-powered delivery predictions with real-time narrative updates',
      color: 'from-orange-500 to-amber-500',
      highlight: 'Live ETA',
    },
    {
      icon: Users,
      title: 'Group Shopping',
      description: 'Collaborative browsing, voting, and shared carts with friends',
      color: 'from-purple-500 to-pink-500',
      highlight: 'Vote Together',
    },
  ];

  const stats = [
    { value: '10M+', label: 'Happy Customers' },
    { value: '98%', label: 'Sustainability Score' },
    { value: '24/7', label: 'AI Support' },
    { value: '500kg', label: 'CO₂ Saved Daily' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4 px-4 py-2 text-sm" variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            Powered by Advanced AI
          </Badge>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            EchoCart
          </h1>
          <p className="text-2xl mb-4 text-muted-foreground">
            The Future of E-Commerce is Here
          </p>
          <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
            Experience emotion-aware shopping with AI that understands you. Get personalized recommendations,
            visual search, predictive tracking, and shop together with friends—all while making sustainable choices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/register">
                Get Started Free
                <Sparkles className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-20">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-center mb-12">
            Intelligent Features for Modern Shopping
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
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold">{feature.title}</h3>
                        <Badge variant="secondary">{feature.highlight}</Badge>
                      </div>
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
          <h2 className="text-4xl font-bold text-center mb-12">How EchoCart Works</h2>
          <div className="space-y-6">
            {[
              {
                step: '01',
                title: 'Chat with AI',
                description: 'Start a conversation with our emotion-aware AI assistant. Upload images for visual search or simply describe what you need.',
                icon: MessageSquare,
              },
              {
                step: '02',
                title: 'Get Smart Recommendations',
                description: 'Receive personalized product suggestions based on your mood, preferences, and sustainability goals.',
                icon: Sparkles,
              },
              {
                step: '03',
                title: 'Shop Together',
                description: 'Create groups, browse collaboratively, vote on products, and share a cart with friends or family.',
                icon: Users,
              },
              {
                step: '04',
                title: 'Track with Confidence',
                description: 'Get predictive delivery ETAs with narrative updates that tell you exactly where your order is and when it will arrive.',
                icon: TrendingUp,
              },
            ].map((item) => (
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

        {/* Sustainability Highlight */}
        <Card className="max-w-4xl mx-auto mb-20 bg-gradient-to-r from-green-500 to-emerald-600 text-white overflow-hidden">
          <CardContent className="p-12 text-center relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
            <div className="relative z-10">
              <Leaf className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-4xl font-bold mb-4">Shop Sustainably</h2>
              <p className="text-xl mb-6 text-white/90 max-w-2xl mx-auto">
                Every product is scored for sustainability. See the carbon footprint, materials used,
                and the story behind each item. Make informed choices for a better planet.
              </p>
              <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                Explore Eco Products
                <Leaf className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Testimonials */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-center mb-12">Loved by Shoppers Worldwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Eco Enthusiast',
                comment: 'The AI chat is incredible! It understood exactly what I was looking for and found the perfect eco-friendly products.',
              },
              {
                name: 'Mike Chen',
                role: 'Tech Lover',
                comment: 'Group shopping changed everything. My family can finally agree on purchases before buying!',
              },
              {
                name: 'Emily Davis',
                role: 'Busy Professional',
                comment: 'The predictive tracking is a game-changer. I always know exactly when my packages will arrive.',
              },
            ].map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.comment}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Shopping?</h2>
            <p className="text-xl mb-8 text-white/90">
              Join millions of happy customers experiencing the future of e-commerce today.
            </p>
            <Button size="lg" variant="secondary" className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6">
              <Link href="/register" className="flex items-center">
                Start Your Journey
                <Zap className="ml-2 h-5 w-5" />
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
              <ShoppingCart className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                EchoCart
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 EchoCart. Powered by AI. Built for sustainability.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">Privacy</Link>
              <Link href="#" className="hover:text-foreground">Terms</Link>
              <Link href="#" className="hover:text-foreground">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}