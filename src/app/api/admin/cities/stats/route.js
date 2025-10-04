// src/app/api/admin/cities/stats/route.js

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import City from '@/app/models/City';

export async function GET(request) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        status: 503,
        message: 'Serviço temporariamente indisponível'
      }, { status: 503 });
    }
    
    const totalCities = await City.countDocuments();
    const activeCities = await City.countDocuments({ isActive: true });
    const inactiveCities = await City.countDocuments({ isActive: false });
    
    // Cities by state
    const citiesByState = await City.aggregate([
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 },
          activeCount: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Cities with most properties
    const topCitiesByProperties = await City.find({ isActive: true })
      .sort({ totalActiveProperties: -1 })
      .limit(10)
      .select('name state totalActiveProperties totalProperties');
    
    // Cities with no properties
    const citiesWithoutProperties = await City.countDocuments({ 
      isActive: true,
      totalActiveProperties: 0 
    });
    
    return NextResponse.json({
      status: 200,
      data: {
        overview: {
          totalCities,
          activeCities,
          inactiveCities,
          citiesWithoutProperties
        },
        citiesByState,
        topCitiesByProperties
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas de cidades:', error);
    return NextResponse.json({
      status: 500,
      message: 'Erro interno do servidor',
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        status: 503,
        message: 'Serviço temporariamente indisponível'
      }, { status: 503 });
    }
    
    console.log('🔄 Atualizando contadores de propriedades...');
    
    // Update property counts for all cities
    await City.updatePropertyCounts();
    
    console.log('✅ Contadores atualizados com sucesso');
    
    return NextResponse.json({
      status: 200,
      message: 'Contadores de propriedades atualizados com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar contadores:', error);
    return NextResponse.json({
      status: 500,
      message: 'Erro interno do servidor',
      error: error.message
    }, { status: 500 });
  }
}