import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workspaces } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const ownerId = searchParams.get('ownerId');

    let query = db.select().from(workspaces);

    // Build WHERE conditions
    const conditions = [];
    
    if (ownerId) {
      if (isNaN(parseInt(ownerId))) {
        return NextResponse.json({ 
          error: "ownerId must be a valid integer",
          code: "INVALID_OWNER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(workspaces.ownerId, parseInt(ownerId)));
    }

    if (search) {
      conditions.push(
        or(
          like(workspaces.name, `%${search}%`),
          like(workspaces.description, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = db.select().from(workspaces).where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, ownerId } = body;

    if (!ownerId || isNaN(parseInt(ownerId))) {
      return NextResponse.json({ 
        error: "Valid ownerId is required",
        code: "MISSING_OWNER_ID" 
      }, { status: 400 });
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ 
        error: "Name is required and must be a string",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json({ 
        error: "Name must not be empty",
        code: "EMPTY_NAME" 
      }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();

    const newWorkspace = await db.insert(workspaces)
      .values({
        ownerId: parseInt(ownerId),
        name: trimmedName,
        description: description?.trim() || null,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      })
      .returning();

    return NextResponse.json(newWorkspace[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();

    if ('ownerId' in body || 'owner_id' in body) {
      return NextResponse.json({ 
        error: "Owner ID cannot be provided in request body",
        code: "OWNER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(workspaces)
      .where(and(eq(workspaces.id, parseInt(id)), eq(workspaces.ownerId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Workspace not found',
        code: "WORKSPACE_NOT_FOUND" 
      }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if ('name' in body) {
      if (typeof body.name !== 'string') {
        return NextResponse.json({ 
          error: "Name must be a string",
          code: "INVALID_NAME_TYPE" 
        }, { status: 400 });
      }
      const trimmedName = body.name.trim();
      if (trimmedName.length === 0) {
        return NextResponse.json({ 
          error: "Name must not be empty",
          code: "EMPTY_NAME" 
        }, { status: 400 });
      }
      updates.name = trimmedName;
    }

    if ('description' in body) {
      updates.description = body.description?.trim() || null;
    }

    const updated = await db.update(workspaces)
      .set(updates)
      .where(and(eq(workspaces.id, parseInt(id)), eq(workspaces.ownerId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Workspace not found',
        code: "WORKSPACE_NOT_FOUND" 
      }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(workspaces)
      .where(and(eq(workspaces.id, parseInt(id)), eq(workspaces.ownerId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Workspace not found',
        code: "WORKSPACE_NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(workspaces)
      .where(and(eq(workspaces.id, parseInt(id)), eq(workspaces.ownerId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Workspace not found',
        code: "WORKSPACE_NOT_FOUND" 
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Workspace deleted successfully',
      workspace: deleted[0]
    }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}