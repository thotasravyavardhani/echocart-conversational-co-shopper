import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { datasets } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid workspace ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const workspaceId = parseInt(id);
    const searchParams = request.nextUrl.searchParams;
    
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(datasets).where(eq(datasets.workspaceId, workspaceId));

    if (search) {
      const searchCondition = or(
        like(datasets.name, `%${search}%`),
        like(datasets.filename, `%${search}%`)
      );
      query = db
        .select()
        .from(datasets)
        .where(and(eq(datasets.workspaceId, workspaceId), searchCondition));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid workspace ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const workspaceId = parseInt(id);
    const body = await request.json();
    const { name, filename, fileUrl, format, createdBy } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!filename || typeof filename !== 'string' || !filename.trim()) {
      return NextResponse.json(
        { error: 'Filename is required and must be a non-empty string', code: 'MISSING_FILENAME' },
        { status: 400 }
      );
    }

    if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.trim()) {
      return NextResponse.json(
        { error: 'File URL is required and must be a non-empty string', code: 'MISSING_FILE_URL' },
        { status: 400 }
      );
    }

    if (!format || typeof format !== 'string' || !format.trim()) {
      return NextResponse.json(
        { error: 'Format is required and must be a non-empty string', code: 'MISSING_FORMAT' },
        { status: 400 }
      );
    }

    const validFormats = ['csv', 'json', 'rasa', 'nlu'];
    if (!validFormats.includes(format.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Format must be one of: ${validFormats.join(', ')}`,
          code: 'INVALID_FORMAT'
        },
        { status: 400 }
      );
    }

    if (!createdBy || typeof createdBy !== 'number' || isNaN(createdBy)) {
      return NextResponse.json(
        { error: 'CreatedBy is required and must be a valid user ID', code: 'MISSING_CREATED_BY' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const newDataset = await db
      .insert(datasets)
      .values({
        workspaceId,
        name: name.trim(),
        filename: filename.trim(),
        fileUrl: fileUrl.trim(),
        format: format.toLowerCase(),
        status: 'uploaded',
        createdBy,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newDataset[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}