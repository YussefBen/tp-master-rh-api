// app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const now = new Date();

  const totalEmployees = await prisma.employees.count();

  const salaryBudget = await prisma.salaries.aggregate({
    _sum: { salary: true },
    where: { to_date: { gt: now } }
  });

  const distribution = await prisma.dept_emp.groupBy({
    by: ['dept_no'],
    _count: { emp_no: true },
    where: { to_date: { gt: now } }
  });

  return NextResponse.json({
    totalEmployees,
    salaryBudget: salaryBudget._sum.salary,
    distribution
  });
}