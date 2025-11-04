import { NextRequest, NextResponse } from 'next/server';

const RASA_URL = process.env.RASA_URL || 'http://localhost:5005';

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

    // Forward to Rasa webhook
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
    });

    if (!rasaResponse.ok) {
      throw new Error(`Rasa server error: ${rasaResponse.statusText}`);
    }

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
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Fallback response if Rasa is not available
    return NextResponse.json([
      {
        text: "I'm having trouble connecting to the AI service right now. Please make sure the Rasa server is running. You can start it with: `cd python-rasa-backend/rasa && rasa run --enable-api --cors \"*\"`",
        products: [],
      }
    ], { status: 200 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    const rasaResponse = await fetch(`${RASA_URL}/`, {
      method: 'GET',
    });

    return NextResponse.json({
      status: rasaResponse.ok ? 'connected' : 'disconnected',
      rasaUrl: RASA_URL,
      message: rasaResponse.ok 
        ? 'Rasa server is running' 
        : 'Rasa server is not responding',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      rasaUrl: RASA_URL,
      message: 'Cannot connect to Rasa server',
      error: (error as Error).message,
    }, { status: 503 });
  }
}
