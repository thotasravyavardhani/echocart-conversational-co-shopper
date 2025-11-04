import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, refreshTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production'
);

export interface User {
  id: number;
  email: string;
  name: string;
  roles?: string[];
}

export async function createAccessToken(user: User): Promise<string> {
  return new SignJWT({ 
    sub: user.id.toString(), 
    email: user.email, 
    name: user.name,
    roles: user.roles || ['user']
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function createRefreshToken(userId: number): Promise<string> {
  const token = await new SignJWT({ sub: userId.toString() })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_REFRESH_SECRET);

  // Store hashed refresh token in database
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
    revoked: false,
  });

  return token;
}

export async function verifyAccessToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: parseInt(payload.sub as string),
      email: payload.email as string,
      name: payload.name as string,
      roles: payload.roles as string[],
    };
  } catch (error) {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    const userId = parseInt(payload.sub as string);

    // Check if token exists and is not revoked
    const storedTokens = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    for (const storedToken of storedTokens) {
      const isValid = await bcrypt.compare(token, storedToken.tokenHash);
      if (isValid && !storedToken.revoked && new Date(storedToken.expiresAt) > new Date()) {
        return userId;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function revokeRefreshToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    const userId = parseInt(payload.sub as string);

    const storedTokens = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    for (const storedToken of storedTokens) {
      const isValid = await bcrypt.compare(token, storedToken.tokenHash);
      if (isValid) {
        await db
          .update(refreshTokens)
          .set({ revoked: true })
          .where(eq(refreshTokens.id, storedToken.id));
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

export async function registerUser(email: string, password: string, name: string) {
  // Check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const newUser = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      roles: JSON.stringify(['user']),
      profile: JSON.stringify({ currency: 'USD', language: 'en', moodHistory: [] }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning();

  return {
    id: newUser[0].id,
    email: newUser[0].email,
    name: newUser[0].name,
    roles: JSON.parse(newUser[0].roles as string),
  };
}

export async function loginUser(email: string, password: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user.length === 0) {
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user[0].passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  return {
    id: user[0].id,
    email: user[0].email,
    name: user[0].name,
    roles: JSON.parse(user[0].roles as string),
  };
}

export async function getUserById(id: number) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return {
    id: user[0].id,
    email: user[0].email,
    name: user[0].name,
    roles: JSON.parse(user[0].roles as string),
  };
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyAccessToken(token);
}