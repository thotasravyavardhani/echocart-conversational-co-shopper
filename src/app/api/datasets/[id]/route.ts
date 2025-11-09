import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { datasets } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_FORMATS = ['csv', 'json', 'rasa', 'nlu'];
const VALID_STATUSES = ['uploaded', 'validated', 'error', 'training', 'trained'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const dataset = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, parseInt(id)))
      .limit(1);

    if (dataset.length === 0) {
      return NextResponse.json(
        { error: 'Dataset not found', code: 'DATASET_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(dataset[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, status, intents, entities, sampleCount, validationReport, errors } = body;

    console.log('📝 PATCH /api/datasets/' + id, body);

    // Check if dataset exists
    const existingDataset = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, parseInt(id)))
      .limit(1);

    if (existingDataset.length === 0) {
      return NextResponse.json(
        { error: 'Dataset not found', code: 'DATASET_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (status !== undefined) updates.status = status;
    if (intents !== undefined) updates.intents = intents;
    if (entities !== undefined) updates.entities = entities;
    if (sampleCount !== undefined) updates.sampleCount = sampleCount;
    if (validationReport !== undefined) updates.validationReport = validationReport;
    if (errors !== undefined) updates.validationReport = { errors };

    console.log('💾 Updating dataset with:', updates);

    const updated = await db
      .update(datasets)
      .set(updates)
      .where(eq(datasets.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update dataset', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    console.log('✅ Dataset updated successfully:', updated[0]);

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, filename, fileUrl, format, status, validationReport } = body;

    // Check if dataset exists
    const existingDataset = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, parseInt(id)))
      .limit(1);

    if (existingDataset.length === 0) {
      return NextResponse.json(
        { error: 'Dataset not found', code: 'DATASET_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate format if provided
    if (format && !VALID_FORMATS.includes(format)) {
      return NextResponse.json(
        {
          error: `Invalid format. Must be one of: ${VALID_FORMATS.join(', ')}`,
          code: 'INVALID_FORMAT',
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (filename !== undefined) updates.filename = filename;
    if (fileUrl !== undefined) updates.fileUrl = fileUrl;
    if (format !== undefined) updates.format = format;
    if (status !== undefined) updates.status = status;
    if (validationReport !== undefined) updates.validationReport = validationReport;

    const updated = await db
      .update(datasets)
      .set(updates)
      .where(eq(datasets.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update dataset', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if dataset exists
    const existingDataset = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, parseInt(id)))
      .limit(1);

    if (existingDataset.length === 0) {
      return NextResponse.json(
        { error: 'Dataset not found', code: 'DATASET_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(datasets)
      .where(eq(datasets.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete dataset', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Dataset deleted successfully',
        dataset: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}