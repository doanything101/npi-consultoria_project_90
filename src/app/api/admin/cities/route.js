// src/app/api/admin/cities/route.js

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
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const state = searchParams.get('state') || '';
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (state) {
      query.state = state.toUpperCase();
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }
    
    // Count total documents
    const totalItems = await City.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;
    
    // Execute query
    const cities = await City.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Get states for filter
    const states = await City.distinct('state');
    
    return NextResponse.json({
      status: 200,
      data: cities,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        states: states.sort()
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar cidades para admin:', error);
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
    
    const body = await request.json();
    const { 
      name, 
      state, 
      region, 
      priority = 0, 
      seoTitle, 
      seoDescription, 
      seoKeywords,
      isActive = true 
    } = body;
    
    if (!name || !state) {
      return NextResponse.json({
        status: 400,
        message: 'Nome e estado são obrigatórios'
      }, { status: 400 });
    }
    
    // Check if city already exists
    const existingCity = await City.findOne({ name: name.trim() });
    if (existingCity) {
      return NextResponse.json({
        status: 409,
        message: 'Cidade já existe'
      }, { status: 409 });
    }
    
    // Create new city
    const newCity = new City({
      name: name.trim(),
      state: state.trim().toUpperCase(),
      region: region?.trim(),
      priority: parseInt(priority) || 0,
      seoTitle: seoTitle?.trim(),
      seoDescription: seoDescription?.trim(),
      seoKeywords: seoKeywords?.trim(),
      isActive: Boolean(isActive)
    });
    
    await newCity.save();
    
    return NextResponse.json({
      status: 201,
      message: 'Cidade criada com sucesso',
      data: newCity
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar cidade:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json({
        status: 409,
        message: `${field === 'slug' ? 'Slug' : 'Nome'} já existe`
      }, { status: 409 });
    }
    
    return NextResponse.json({
      status: 500,
      message: 'Erro interno do servidor',
      error: error.message
    }, { status: 500 });
  }
}