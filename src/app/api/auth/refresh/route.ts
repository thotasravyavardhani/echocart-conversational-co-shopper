import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, getUserById, createAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  let body;
  try {
    // 💡 FIX: Safely parse the JSON body
    body = await request.json();
  } catch (e) {
    // If parsing fails (e.g., empty body), set body to an empty object
    body = {}; 
  }
  
  // Use safe destructuring
  const { refreshToken } = body;

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'Missing refreshToken' },
      { status: 400 }
    );
  }
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    const userId = await verifyRefreshToken(refreshToken);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    const user = await getUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const accessToken = await createAccessToken(user);

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}