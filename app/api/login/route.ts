// app/api/login/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();
const SECRET = new TextEncoder().encode('MON_SUPER_SECRET');

export async function POST(req: Request) {
  const body = await req.json(); // On récupère les données envoyées
  const { email, password } = body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await new SignJWT({ sub: user.id.toString(), isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('2h')
    .sign(SECRET);

  const response = NextResponse.json({ success: true });
  
  response.cookies.set('token', token, {
    httpOnly: true,
    path: '/',
  });

  return response;
}