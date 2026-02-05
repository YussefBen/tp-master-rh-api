import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();


const UpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  deptNo: z.string().optional(),
  hireDate: z.string().refine(d => new Date(d) <= new Date(), "Date future interdite").optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const empId = parseInt(params.id);
  const now = new Date();

  const employee = await prisma.employees.findUnique({
    where: { emp_no: empId },
    include: {
      titles: { where: { to_date: { gt: now } } },
      salaries: { where: { to_date: { gt: now } } },
      dept_emp: { 
        where: { to_date: { gt: now } },
        include: { departments: true }
      }
    }
  });

  if (!employee) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const empId = parseInt(params.id);
  const body = await req.json();

  const validation = UpdateSchema.safeParse(body);
  if (!validation.success) return NextResponse.json(validation.error, { status: 400 });

  const { firstName, lastName, deptNo, hireDate } = validation.data;
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.employees.update({
        where: { emp_no: empId },
        data: {
          first_name: firstName,
          last_name: lastName,
          hire_date: hireDate ? new Date(hireDate) : undefined,
        }
      });

      if (deptNo) {
        await tx.dept_emp.updateMany({
          where: { emp_no: empId, to_date: { gt: now } },
          data: { to_date: now }
        });
        
        await tx.dept_emp.create({
          data: {
            emp_no: empId,
            dept_no: deptNo,
            from_date: now,
            to_date: new Date('9999-01-01')
          }
        });
      }
      return updated;
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}