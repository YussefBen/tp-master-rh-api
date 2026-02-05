import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


interface ExportStrategy {
  generate(data: any[]): string;
  getContentType(): string;
}


class JsonExportStrategy implements ExportStrategy {
  generate(data: any[]): string {
    return JSON.stringify(data, null, 2);
  }
  
  getContentType(): string {
    return 'application/json';
  }
}

class CsvExportStrategy implements ExportStrategy {
  generate(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    
    const rows = data.map(row => {
      return Object.values(row).map(value => `"${value}"`).join(',');
    });


    return [headers, ...rows].join('\n');
  }

  getContentType(): string {
    return 'text/csv';
  }
}


class ExportContext {
  private strategy: ExportStrategy;

  constructor(type: string | null) {
    if (type === 'csv') {
      this.strategy = new CsvExportStrategy();
    } else {
      this.strategy = new JsonExportStrategy();
    }
  }

  execute(data: any[]) {
    return {
      content: this.strategy.generate(data),
      contentType: this.strategy.getContentType()
    };
  }
}


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

 
  const rawData = await prisma.dept_emp.findMany({
    take: 50, 
    where: { 
      to_date: { gt: new Date() } 
    },
    select: {
      departments: {
        select: { dept_name: true }
      },
      employees: {
        select: {
          last_name: true,
          first_name: true,
          salaries: {
            where: { to_date: { gt: new Date() } }, 
            select: { salary: true },
            take: 1
          }
        }
      }
    }
  });

  const cleanData = rawData.map(item => ({
    Department: item.departments.dept_name,
    Employee: `${item.employees.first_name} ${item.employees.last_name}`,
    Salary: item.employees.salaries[0]?.salary || 0
  }));

  const context = new ExportContext(type);
  const result = context.execute(cleanData);

  return new NextResponse(result.content, {
    headers: {
      'Content-Type': result.contentType,
      ...(type === 'csv' && { 
        'Content-Disposition': 'attachment; filename="salaries_export.csv"' 
      })
    }
  });
}