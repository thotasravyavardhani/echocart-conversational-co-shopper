import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trainingJobs } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate workspaceId is present and valid
    if (!workspaceId) {
      return NextResponse.json(
        { 
          error: 'workspaceId is required',
          code: 'MISSING_WORKSPACE_ID'
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

    const workspaceIdInt = parseInt(workspaceId);

    // Build query with workspaceId filter
    let query = db.select()
      .from(trainingJobs)
      .where(eq(trainingJobs.workspaceId, workspaceIdInt));

    // Add status filter if provided
    if (status) {
      query = db.select()
        .from(trainingJobs)
        .where(
          and(
            eq(trainingJobs.workspaceId, workspaceIdInt),
            eq(trainingJobs.status, status)
          )
        );
    }

    // Execute query with ordering and pagination
    const results = await query
      .orderBy(desc(trainingJobs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}