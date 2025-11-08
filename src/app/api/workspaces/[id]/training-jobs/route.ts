import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trainingJobs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid workspace ID is required' },
        { status: 400 }
      );
    }

    const workspaceId = parseInt(id);

    // Fetch all training jobs for this workspace, ordered by most recent first
    const jobs = await db
      .select()
      .from(trainingJobs)
      .where(eq(trainingJobs.workspaceId, workspaceId))
      .orderBy(desc(trainingJobs.createdAt));

    return NextResponse.json(jobs, { status: 200 });
  } catch (error) {
    console.error('GET training jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training jobs: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
