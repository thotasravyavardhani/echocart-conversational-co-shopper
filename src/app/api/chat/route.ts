import { NextRequest, NextResponse } from 'next/server';

const RASA_URL = process.env.RASA_URL || 'http://localhost:5005';

// Fallback AI service - works without Rasa
class FallbackAI {
  private products = [
    {
      id: 'prod_1',
      name: 'Cozy Organic Cotton Hoodie',
      description: 'Ultra-soft organic cotton hoodie perfect for relaxing',
      price: 49.99,
      rating: 4.8,
      sustainability_score: 0.92,
      category: 'clothing',
      mood: ['tired', 'lazy', 'stressed'],
    },
    {
      id: 'prod_2',
      name: 'Eco-Friendly Yoga Mat',
      description: 'Sustainable cork and natural rubber yoga mat',
      price: 79.99,
      rating: 4.9,
      sustainability_score: 0.95,
      category: 'fitness',
      mood: ['stressed', 'adventurous'],
    },
    {
      id: 'prod_3',
      name: 'Bamboo Loungewear Set',
      description: 'Breathable bamboo pajama set for ultimate comfort',
      price: 64.99,
      rating: 4.7,
      sustainability_score: 0.88,
      category: 'clothing',
      mood: ['tired', 'lazy'],
    },
    {
      id: 'prod_4',
      name: 'Wireless Noise-Cancelling Headphones',
      description: 'Premium sound quality with eco-friendly packaging',
      price: 199.99,
      rating: 4.6,
      sustainability_score: 0.73,
      category: 'electronics',
      mood: ['excited', 'adventurous'],
    },
    {
      id: 'prod_5',
      name: 'Recycled Denim Jacket',
      description: 'Stylish jacket made from 100% recycled denim',
      price: 89.99,
      rating: 4.8,
      sustainability_score: 0.91,
      category: 'clothing',
      mood: ['excited', 'adventurous'],
    },
    {
      id: 'prod_6',
      name: 'Aromatherapy Essential Oil Set',
      description: 'Natural essential oils for relaxation and wellness',
      price: 34.99,
      rating: 4.9,
      sustainability_score: 0.96,
      category: 'wellness',
      mood: ['stressed', 'tired'],
    },
    {
      id: 'prod_7',
      name: 'Sustainable Running Shoes',
      description: 'High-performance shoes made from recycled ocean plastic',
      price: 129.99,
      rating: 4.7,
      sustainability_score: 0.89,
      category: 'footwear',
      mood: ['adventurous', 'excited'],
    },
    {
      id: 'prod_8',
      name: 'Organic Herbal Tea Collection',
      description: 'Premium loose-leaf teas for calm and comfort',
      price: 24.99,
      rating: 4.8,
      sustainability_score: 0.94,
      category: 'food',
      mood: ['tired', 'stressed', 'lazy'],
    },
  ];

  detectIntent(message: string): { intent: string; entities: any } {
    const msg = message.toLowerCase();
    
    // Emotion/mood detection
    if (msg.includes('tired') || msg.includes('exhausted') || msg.includes('sleepy')) {
      return { intent: 'mood_tired', entities: { mood: 'tired' } };
    }
    if (msg.includes('stressed') || msg.includes('anxiety') || msg.includes('overwhelmed')) {
      return { intent: 'mood_stressed', entities: { mood: 'stressed' } };
    }
    if (msg.includes('excited') || msg.includes('energetic') || msg.includes('party')) {
      return { intent: 'mood_excited', entities: { mood: 'excited' } };
    }
    if (msg.includes('lazy') || msg.includes('chill') || msg.includes('relax')) {
      return { intent: 'mood_lazy', entities: { mood: 'lazy' } };
    }
    if (msg.includes('adventurous') || msg.includes('active') || msg.includes('outdoors')) {
      return { intent: 'mood_adventurous', entities: { mood: 'adventurous' } };
    }

    // Product search
    if (msg.includes('shoes') || msg.includes('sneakers') || msg.includes('footwear')) {
      return { intent: 'product_search', entities: { category: 'footwear' } };
    }
    if (msg.includes('clothes') || msg.includes('clothing') || msg.includes('outfit')) {
      return { intent: 'product_search', entities: { category: 'clothing' } };
    }
    if (msg.includes('electronics') || msg.includes('headphones') || msg.includes('gadget')) {
      return { intent: 'product_search', entities: { category: 'electronics' } };
    }

    // Sustainability
    if (msg.includes('eco') || msg.includes('sustainable') || msg.includes('green') || msg.includes('environment')) {
      return { intent: 'sustainability', entities: {} };
    }

    // Price filtering
    if (msg.includes('under') || msg.includes('below') || msg.includes('cheap') || msg.includes('budget')) {
      const priceMatch = msg.match(/\$?(\d+)/);
      const maxPrice = priceMatch ? parseInt(priceMatch[1]) : 100;
      return { intent: 'price_filter', entities: { max_price: maxPrice } };
    }

    // Order tracking
    if (msg.includes('track') || msg.includes('order') || msg.includes('delivery') || msg.includes('shipping')) {
      return { intent: 'track_order', entities: {} };
    }

    // Greetings
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('start')) {
      return { intent: 'greet', entities: {} };
    }

    // Help
    if (msg.includes('help') || msg.includes('what can you do')) {
      return { intent: 'help', entities: {} };
    }

    return { intent: 'general', entities: {} };
  }

  getResponse(intent: string, entities: any, message: string): any[] {
    switch (intent) {
      case 'greet':
        return [{
          text: "Hey there! 👋 I'm your EchoCart AI assistant. I can help you find products based on your mood, track orders, and discover sustainable options.\n\nTry saying:\n• \"I'm tired, show me cozy clothes\"\n• \"Eco-friendly products under $100\"\n• \"Track my order\"\n• \"Feeling excited, need outfit ideas\"",
          products: [],
        }];

      case 'mood_tired':
        const tiredProducts = this.products.filter(p => p.mood.includes('tired')).slice(0, 3);
        return [{
          text: "I hear you! 😌 When you're feeling tired, comfort is key. Here are some cozy picks perfect for relaxing:",
          products: tiredProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            rating: p.rating,
            sustainability_score: p.sustainability_score,
            relevance_score: 0.95,
          })),
        }];

      case 'mood_stressed':
        const stressedProducts = this.products.filter(p => p.mood.includes('stressed')).slice(0, 3);
        return [{
          text: "Take a deep breath 🌿 Let me help you find some calming essentials to ease your mind:",
          products: stressedProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            rating: p.rating,
            sustainability_score: p.sustainability_score,
            relevance_score: 0.93,
          })),
        }];

      case 'mood_excited':
        const excitedProducts = this.products.filter(p => p.mood.includes('excited')).slice(0, 3);
        return [{
          text: "Love the energy! ⚡ Here are some exciting picks to match your vibe:",
          products: excitedProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            rating: p.rating,
            sustainability_score: p.sustainability_score,
            relevance_score: 0.94,
          })),
        }];

      case 'mood_lazy':
        const lazyProducts = this.products.filter(p => p.mood.includes('lazy')).slice(0, 3);
        return [{
          text: "Perfect day for lounging! 🛋️ Check out these ultra-comfy options:",
          products: lazyProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            rating: p.rating,
            sustainability_score: p.sustainability_score,
            relevance_score: 0.96,
          })),
        }];

      case 'mood_adventurous':
        const adventurousProducts = this.products.filter(p => p.mood.includes('adventurous')).slice(0, 3);
        return [{
          text: "Adventure awaits! 🌍 Here are some picks to fuel your active lifestyle:",
          products: adventurousProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            rating: p.rating,
            sustainability_score: p.sustainability_score,
            relevance_score: 0.92,
          })),
        }];

      case 'product_search':
        const category = entities.category || 'clothing';
        const categoryProducts = this.products.filter(p => p.category === category).slice(0, 3);
        return [{
          text: `Great choice! Here are some ${category} options for you:`,
          products: categoryProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            rating: p.rating,
            sustainability_score: p.sustainability_score,
            relevance_score: 0.88,
          })),
        }];

      case 'sustainability':
        const ecoProducts = this.products
          .filter(p => p.sustainability_score > 0.85)
          .sort((a, b) => b.sustainability_score - a.sustainability_score)
          .slice(0, 3);
        return [{
          text: "🌱 Love your commitment to sustainability! Here are our top eco-friendly products with 85%+ sustainability scores:",
          products: ecoProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            rating: p.rating,
            sustainability_score: p.sustainability_score,
            relevance_score: 0.97,
          })),
        }];

      case 'price_filter':
        const maxPrice = entities.max_price || 100;
        const affordableProducts = this.products
          .filter(p => p.price <= maxPrice)
          .sort((a, b) => a.price - b.price)
          .slice(0, 3);
        return [{
          text: `💰 Here are some great options under $${maxPrice}:`,
          products: affordableProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            rating: p.rating,
            sustainability_score: p.sustainability_score,
            relevance_score: 0.89,
          })),
        }];

      case 'track_order':
        return [{
          text: "📦 Order Tracking:\n\nOrder #EC-2024-1234\nStatus: Out for Delivery\nExpected: Today by 6:00 PM\n\n🚚 Your package is currently 2 stops away! Our AI predicts it will arrive between 5:15 PM - 5:45 PM based on current traffic patterns.\n\nContents:\n• Organic Cotton Hoodie (Grey, M)\n• Eco-Friendly Yoga Mat\n\nYou'll receive a notification when it's delivered!",
          products: [],
        }];

      case 'help':
        return [{
          text: "🤖 Here's what I can do for you:\n\n💭 **Emotion-Aware Shopping**\nTell me how you're feeling, and I'll recommend products that match your mood.\n\n🌿 **Sustainability Focus**\nFind eco-friendly products with high sustainability scores.\n\n💰 **Price Filtering**\nSearch within your budget (e.g., \"under $50\").\n\n📦 **Order Tracking**\nGet real-time updates on your deliveries.\n\n🔍 **Smart Search**\nSearch by category, mood, or specific items.\n\nTry: \"I'm stressed, show me calming products\" or \"Eco-friendly shoes under $150\"",
          products: [],
        }];

      default:
        // Random products for general queries
        const randomProducts = [...this.products]
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        return [{
          text: "Here are some popular products you might like:",
          products: randomProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            rating: p.rating,
            sustainability_score: p.sustainability_score,
            relevance_score: 0.85,
          })),
        }];
    }
  }

  async processMessage(message: string): Promise<any[]> {
    const { intent, entities } = this.detectIntent(message);
    return this.getResponse(intent, entities, message);
  }
}

const fallbackAI = new FallbackAI();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sender, metadata } = body;

    // Validate required fields
    if (!message || !sender) {
      return NextResponse.json(
        { error: 'message and sender are required' },
        { status: 400 }
      );
    }

    // Try Rasa first, fall back to our AI if Rasa is unavailable
    try {
      const rasaResponse = await fetch(`${RASA_URL}/webhooks/rest/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender,
          message,
          metadata: metadata || {},
        }),
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });

      if (rasaResponse.ok) {
        const rasaData = await rasaResponse.json();

        // Transform Rasa response to our format
        const responses = rasaData.map((msg: any) => ({
          text: msg.text || '',
          products: msg.custom?.products || msg.json_message?.products || [],
          buttons: msg.buttons || [],
          image: msg.image || null,
          custom: msg.custom || null,
        }));

        return NextResponse.json(responses, { status: 200 });
      }
    } catch (rasaError) {
      // Rasa is unavailable, use fallback
      console.log('Rasa unavailable, using fallback AI');
    }

    // Use fallback AI
    const fallbackResponse = await fallbackAI.processMessage(message);
    return NextResponse.json(fallbackResponse, { status: 200 });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json([
      {
        text: "Sorry, I encountered an error. Please try again!",
        products: [],
      }
    ], { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    const rasaResponse = await fetch(`${RASA_URL}/`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });

    return NextResponse.json({
      status: rasaResponse.ok ? 'connected' : 'fallback',
      rasaUrl: RASA_URL,
      message: rasaResponse.ok 
        ? 'Rasa server is running' 
        : 'Using fallback AI service',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'fallback',
      rasaUrl: RASA_URL,
      message: 'Using fallback AI service (Rasa unavailable)',
    }, { status: 200 });
  }
}