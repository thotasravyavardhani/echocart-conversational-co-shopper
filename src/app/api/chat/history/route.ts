import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversationHistory } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate required workspaceId parameter
    if (!workspaceId || isNaN(parseInt(workspaceId))) {
      return NextResponse.json(
        { 
          error: 'Valid workspaceId is required',
          code: 'INVALID_WORKSPACE_ID' 
        },
        { status: 400 }
      );
    }

    // Build WHERE conditions
    const conditions = [eq(conversationHistory.workspaceId, parseInt(workspaceId))];

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { 
            error: 'userId must be a valid integer',
            code: 'INVALID_USER_ID' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(conversationHistory.userId, parseInt(userId)));
    }

    if (sessionId) {
      conditions.push(eq(conversationHistory.sessionId, sessionId));
    }

    // Execute query with filters, ordering, and pagination
    const results = await db
      .select()
      .from(conversationHistory)
      .where(and(...conditions))
      .orderBy(desc(conversationHistory.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, workspaceId, sessionId, message, intent, entities, sentiment, response } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'userId is required',
          code: 'MISSING_USER_ID' 
        },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { 
          error: 'workspaceId is required',
          code: 'MISSING_WORKSPACE_ID' 
        },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { 
          error: 'sessionId is required',
          code: 'MISSING_SESSION_ID' 
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { 
          error: 'message is required',
          code: 'MISSING_MESSAGE' 
        },
        { status: 400 }
      );
    }

    // Validate types
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { 
          error: 'userId must be a valid integer',
          code: 'INVALID_USER_ID' 
        },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(workspaceId))) {
      return NextResponse.json(
        { 
          error: 'workspaceId must be a valid integer',
          code: 'INVALID_WORKSPACE_ID' 
        },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedSessionId = sessionId.trim();
    const sanitizedMessage = message.trim();
    const sanitizedIntent = intent ? intent.trim() : null;
    const sanitizedSentiment = sentiment ? sentiment.trim() : null;
    const sanitizedResponse = response ? response.trim() : null;

    // Prepare insert data
    const insertData: any = {
      userId: parseInt(userId),
      workspaceId: parseInt(workspaceId),
      sessionId: sanitizedSessionId,
      message: sanitizedMessage,
      createdAt: new Date().toISOString(),
    };

    // Add optional fields if provided
    if (sanitizedIntent) {
      insertData.intent = sanitizedIntent;
    }

    if (entities) {
      insertData.entities = entities;
    }

    if (sanitizedSentiment) {
      insertData.sentiment = sanitizedSentiment;
    }

    if (sanitizedResponse) {
      insertData.response = sanitizedResponse;
    }

    // Insert conversation record
    const newConversation = await db
      .insert(conversationHistory)
      .values(insertData)
      .returning();

    return NextResponse.json(newConversation[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}