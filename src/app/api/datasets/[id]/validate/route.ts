import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { datasets } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid dataset ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const datasetId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { validationReport } = body;

    // Validate validationReport is provided
    if (!validationReport) {
      return NextResponse.json(
        { 
          error: 'Validation report is required',
          code: 'MISSING_VALIDATION_REPORT' 
        },
        { status: 400 }
      );
    }

    // Validate validationReport is an object
    if (typeof validationReport !== 'object' || Array.isArray(validationReport)) {
      return NextResponse.json(
        { 
          error: 'Validation report must be a JSON object',
          code: 'INVALID_VALIDATION_REPORT' 
        },
        { status: 400 }
      );
    }

    // Check if dataset exists
    const existingDataset = await db.select()
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    if (existingDataset.length === 0) {
      return NextResponse.json(
        { 
          error: 'Dataset not found',
          code: 'DATASET_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Determine status based on validation report
    // Check for common validation report patterns
    let status = 'valid';
    
    if (validationReport.errors && Array.isArray(validationReport.errors) && validationReport.errors.length > 0) {
      status = 'invalid';
    } else if (validationReport.isValid === false) {
      status = 'invalid';
    } else if (validationReport.success === false) {
      status = 'invalid';
    } else if (validationReport.status === 'invalid' || validationReport.status === 'failed' || validationReport.status === 'error') {
      status = 'invalid';
    }

    // Update dataset with validation report and status
    const updatedDataset = await db.update(datasets)
      .set({
        status,
        validationReport: JSON.stringify(validationReport),
        updatedAt: new Date().toISOString()
      })
      .where(eq(datasets.id, datasetId))
      .returning();

    if (updatedDataset.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update dataset',
          code: 'UPDATE_FAILED' 
        },
        { status: 500 }
      );
    }

    // Parse the validationReport back to object for response
    const response = {
      ...updatedDataset[0],
      validationReport: updatedDataset[0].validationReport 
        ? JSON.parse(updatedDataset[0].validationReport as string) 
        : null
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}