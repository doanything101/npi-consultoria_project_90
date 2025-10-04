// src/app/api/health/route.js - Health Check API

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Imovel from '@/app/models/Imovel';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test database connection
    await connectToDatabase();
    
    // Test a simple query
    const propertyCount = await Imovel.countDocuments();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      propertyCount,
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV,
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV,
    }, { status: 500 });
  }
}
