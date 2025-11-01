// app/api/test-categories/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '../../lib/db/local-client';

export async function GET() {
  try {
    const categories = await localPrisma.testCategory.findMany({
      where: {
        is_active: true,
        parent_id: null // Only get top-level categories
      },
      include: {
        children: {
          include: {
            children: true,
            tests: {
              where: { is_active: true },
              include: {
                category: true,
                parameters: { // ADD THIS - include parameters
                  orderBy: { sort_order: 'asc' },
                },
              },
            },
          },
        },
        tests: {
          where: { is_active: true },
          include: {
            category: true,
            parameters: { // ADD THIS - include parameters
              orderBy: { sort_order: 'asc' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Failed to fetch test categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch test categories'
      },
      { status: 500 }
    );
  }
}