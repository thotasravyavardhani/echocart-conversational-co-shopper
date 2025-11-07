import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { datasets } from '@/db/schema';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'datasets');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    if (!workspaceId || isNaN(parseInt(workspaceId))) {
      return NextResponse.json(
        { error: 'Valid workspace ID is required', code: 'INVALID_WORKSPACE_ID' },
        { status: 400 }
      );
    }

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 500MB limit', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // Validate file format
    const filename = file.name.toLowerCase();
    let format: string;
    
    if (filename.endsWith('.csv')) {
      format = 'csv';
    } else if (filename.endsWith('.json')) {
      format = 'json';
    } else if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
      format = 'rasa';
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload CSV, JSON, or Rasa YAML files', code: 'INVALID_FORMAT' },
        { status: 400 }
      );
    }

    // Save file to disk
    await ensureUploadDir();
    const timestamp = Date.now();
    const safeFilename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = join(UPLOAD_DIR, safeFilename);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/datasets/${safeFilename}`;

    // Create database record
    const newDataset = await db
      .insert(datasets)
      .values({
        workspaceId: parseInt(workspaceId),
        name: file.name,
        filename: safeFilename,
        fileUrl,
        format,
        status: 'uploaded',
        createdBy: parseInt(userId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Trigger validation in background
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/datasets/${newDataset[0].id}/validate`, {
      method: 'POST',
    }).catch(console.error);

    return NextResponse.json({
      message: 'Dataset uploaded successfully',
      dataset: newDataset[0],
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload dataset: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
