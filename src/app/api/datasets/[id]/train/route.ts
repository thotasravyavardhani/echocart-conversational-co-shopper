import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { datasets, trainingJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid dataset ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const datasetId = parseInt(id);

    // Query the dataset to get workspaceId
    const dataset = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    // If dataset not found, return 404
    if (dataset.length === 0) {
      return NextResponse.json(
        {
          error: 'Dataset not found',
          code: 'DATASET_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const workspaceId = dataset[0].workspaceId;

    // Create a new training job
    const newTrainingJob = await db
      .insert(trainingJobs)
      .values({
        workspaceId,
        datasetId,
        status: 'queued',
        log: null,
        modelPath: null,
        createdAt: new Date().toISOString(),
        finishedAt: null,
      })
      .returning();

    // Update dataset status to "parsing"
    await db
      .update(datasets)
      .set({
        status: 'parsing',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(datasets.id, datasetId));

    return NextResponse.json(newTrainingJob[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}