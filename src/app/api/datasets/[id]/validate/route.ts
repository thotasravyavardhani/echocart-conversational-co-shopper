import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { datasets } from '@/db/schema';
import { eq } from 'drizzle-orm';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const datasetId = parseInt(id);

    if (!id || isNaN(datasetId)) {
      return NextResponse.json(
        { error: 'Valid dataset ID is required' },
        { status: 400 }
      );
    }

    // Get dataset from database
    const dataset = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    if (dataset.length === 0) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    const datasetRecord = dataset[0];

    // Call Python backend for validation
    const pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/datasets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        file_path: datasetRecord.fileUrl,
        format: datasetRecord.format,
      }),
    });

    if (!pythonResponse.ok) {
      throw new Error('Python backend validation failed');
    }

    const validationResult = await pythonResponse.json();

    // Update database with validation results
    await db
      .update(datasets)
      .set({
        status: validationResult.valid ? 'validated' : 'error',
        intents: validationResult.intents || [],
        entities: validationResult.entities || [],
        sampleCount: validationResult.sample_count || 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(datasets.id, datasetId));

    return NextResponse.json(validationResult, { status: 200 });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate dataset: ' + (error as Error).message },
      { status: 500 }
    );
  }
}