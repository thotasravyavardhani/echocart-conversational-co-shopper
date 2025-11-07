import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trainingJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (!id || isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Valid training job ID is required' },
        { status: 400 }
      );
    }

    const job = await db
      .select()
      .from(trainingJobs)
      .where(eq(trainingJobs.id, jobId))
      .limit(1);

    if (job.length === 0) {
      return NextResponse.json(
        { error: 'Training job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(job[0], { status: 200 });
  } catch (error) {
    console.error('GET training job error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training job' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    const body = await request.json();

    if (!id || isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Valid training job ID is required' },
        { status: 400 }
      );
    }

    // Update training job with new data from Python backend
    const updated = await db
      .update(trainingJobs)
      .set({
        status: body.status,
        progress: body.progress,
        log: body.log,
        modelPath: body.modelPath,
        finishedAt: body.finishedAt || null,
      })
      .where(eq(trainingJobs.id, jobId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Training job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PATCH training job error:', error);
    return NextResponse.json(
      { error: 'Failed to update training job' },
      { status: 500 }
    );
  }
}
