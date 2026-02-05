import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('MON_SUPER_SECRET');

export async function middleware(req: NextRequest) {
  // 1. Récupération du token
  const token = req.cookies.get('token')?.value;

  // 2. Si pas de token, on rejette
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 3. Vérification du token
    const { payload } = await jwtVerify(token, SECRET);

    // 4. Protection Admin pour la route /api/stats
    if (req.nextUrl.pathname.startsWith('/api/stats') && !payload.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
  }
}

// Appliquer uniquement sur les routes API protégées
export const config = {
  matcher: ['/api/stats/:path*', '/api/employees/:path*', '/api/export/:path*'], 
};