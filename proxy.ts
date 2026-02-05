import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('MON_SUPER_SECRET');

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);

    if (req.nextUrl.pathname.startsWith('/api/stats') && !payload.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/stats/:path*', '/api/employees/:path*', '/api/export/:path*'], 
};