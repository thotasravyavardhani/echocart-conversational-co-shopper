import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { datasets, trainingJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid dataset ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const datasetId = parseInt(id);

    // Get dataset from database
    const dataset = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    if (dataset.length === 0) {
      return NextResponse.json(
        { error: 'Dataset not found', code: 'DATASET_NOT_FOUND' },
        { status: 404 }
      );
    }

    const datasetRecord = dataset[0];
    const workspaceId = datasetRecord.workspaceId;

    // Create training job in database
    const newTrainingJob = await db
      .insert(trainingJobs)
      .values({
        workspaceId,
        datasetId,
        status: 'queued',
        log: 'Training job created, waiting to start...\n',
        modelPath: null,
        createdAt: new Date().toISOString(),
        finishedAt: null,
      })
      .returning();

    const trainingJobId = newTrainingJob[0].id;

    // Update dataset status
    await db
      .update(datasets)
      .set({
        status: 'training',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(datasets.id, datasetId));

    // Call Python backend to start training (non-blocking)
    fetch(`${PYTHON_BACKEND_URL}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        training_job_id: trainingJobId,
        file_path: datasetRecord.fileUrl,
        format: datasetRecord.format,
      }),
    }).catch(console.error);

    return NextResponse.json({
      message: 'Training started',
      training_job: newTrainingJob[0],
    }, { status: 201 });

  } catch (error) {
    console.error('Training error:', error);
    return NextResponse.json(
      { error: 'Failed to start training: ' + (error as Error).message },
      { status: 500 }
    );
  }
}