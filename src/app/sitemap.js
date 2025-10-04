// src/app/sitemap.js - SEO OPTIMIZED SITEMAP

import { connectToDatabase } from '@/app/lib/mongodb';
import Imovel from '@/app/models/Imovel';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://npiconsultoria.com.br';
  
  try {
    await connectToDatabase();
    
    // Static pages with high priority
    const staticPages = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/busca`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/sobre`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/sobre/hub-imobiliarias`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/sobre/npi-imoveis`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/sobre/nossos-servicos`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/contato`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/venda-seu-imovel`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
    ];

    // Fetch properties from database
    const imoveis = await Imovel.find({ 
      $or: [
        { Situacao: { $in: ['Disponível', 'Vendido', 'Locado'] } },
        { Situacao: { $exists: false } }
      ]
    })
    .select('Codigo Slug Empreendimento updatedAt')
    .lean()
    .limit(10000); // Limit to prevent memory issues

    // Fetch condominios from database (using Imovel model with Condominio: "Sim")
    const condominios = await Imovel.find({ Condominio: "Sim" })
      .select('Slug Empreendimento updatedAt')
      .lean()
      .limit(5000);

    // Property pages with high priority
    const propertyPages = imoveis.map(imovel => ({
      url: `${baseUrl}/imovel-${imovel.Codigo}${imovel.Slug ? `/${imovel.Slug}` : ''}`,
      lastModified: imovel.updatedAt ? new Date(imovel.updatedAt) : new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    }));

    // Condominio pages
    const condominioPages = condominios.map(condominio => ({
      url: `${baseUrl}/${condominio.Slug}`,
      lastModified: condominio.updatedAt ? new Date(condominio.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticPages, ...propertyPages, ...condominioPages];

  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Fallback with static pages only
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/busca`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/sobre`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
    ];
  }
}
