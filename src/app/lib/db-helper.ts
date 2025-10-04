import { connectToDatabase } from './mongodb';
import { NextResponse } from 'next/server';

/**
 * Helper function to handle database connections in API routes
 * Returns a proper error response if database is not available during build time
 */
export async function withDatabase<T>(
    handler: () => Promise<T>
): Promise<T | NextResponse> {
    try {
        const db = await connectToDatabase();
        if (!db) {
            return NextResponse.json({
                status: 503,
                message: 'Serviço temporariamente indisponível'
            }, { status: 503 });
        }
        return await handler();
    } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json({
            status: 500,
            message: 'Erro interno do servidor',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
    }
}

/**
 * Check if database is available (for build-time checks)
 */
export function isDatabaseAvailable(): boolean {
    return !!(process.env.MONGODB_URI || process.env.NODE_ENV === 'development');
}
