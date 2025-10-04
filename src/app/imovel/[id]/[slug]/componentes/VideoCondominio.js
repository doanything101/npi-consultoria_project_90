// src/app/imovel/[id]/[slug]/componentes/VideoCondominio.js
// 🚀 VERSÃO CORRIGIDA: GSC COMPLIANT + PERFORMANCE OTIMIZADA

"use client";

import { useState, useEffect } from "react";

export default function VideoCondominio({ imovel }) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [videoMetadata, setVideoMetadata] = useState(null);
  
  // 🔍 DEBUG LOGGING
  console.log('🎬 VideoCondominio (Imóvel) iniciado para:', imovel?.Empreendimento);
  
  // 🚨 FUNÇÃO CRÍTICA: Limpar URLs mal formadas do banco
  const cleanMalformedUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // Remove duplicações de protocolo
    url = url.replace(/https:\/\/www\.youtube\.com\/watch\?v=https:\/\//, 'https://');
    url = url.replace(/https:\/\/www\.youtube\.com\/embed\/https:\/\//, 'https://');
    
    // Remove parâmetros inválidos
    url = url.replace(/\?si=.*$/, '');
    
    // Corrige embed URLs mal formadas
    if (url.includes('/embed/https://youtu.be/')) {
      const match = url.match(/\/embed\/https:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (match) {
        return `https://www.youtube.com/watch?v=${match[1]}`;
      }
    }
    
    // Remove URLs que são apenas canais ou playlists
    const invalidPatterns = [
      '/@', '/channel/', '/user/', '/c/', 
      'UC3TnMJs2iCksc46bTQyd-fw', 
      '3quadras_imobiliaria',
      'poweredbypilar',
      'ganzaroli.imoveis',
      'avereimoveis',
      '/playlist'
    ];
    
    for (const pattern of invalidPatterns) {
      if (url.includes(pattern)) {
        console.log('❌ URL inválida detectada (canal/playlist):', url);
        return null;
      }
    }
    
    // Verifica se é apenas URL base sem ID
    if (url === 'https://www.youtube.com/watch?v=' || 
        url === 'https://www.youtube.com/embed/' ||
        url === 'https://youtu.be/') {
      console.log('❌ URL sem ID de vídeo:', url);
      return null;
    }
    
    // Verifica se contém ID problemático específico
    if (url.includes('4Aq7szgycT4')) {
      console.log('❌ ID problemático detectado:', url);
      return null;
    }
    
    return url;
  };
  
  // 🎯 EXTRAÇÃO ROBUSTA DO VIDEO ID
  const extractVideoId = () => {
    console.log('🔍 Iniciando extração de Video ID do Imóvel');
    
    if (!imovel?.Video) {
      console.log('❌ Sem dados de vídeo no imóvel');
      return null;
    }
    
    // Processar estrutura do objeto Video
    let rawVideoData = null;
    
    // Tentar extrair de diferentes estruturas possíveis
    if (typeof imovel.Video === 'string') {
      rawVideoData = imovel.Video;
    } else if (typeof imovel.Video === 'object' && !Array.isArray(imovel.Video)) {
      // Pegar primeiro valor do objeto
      const values = Object.values(imovel.Video);
      if (values.length > 0) {
        const firstValue = values[0];
        if (typeof firstValue === 'string') {
          rawVideoData = firstValue;
        } else if (firstValue?.Video) {
          rawVideoData = firstValue.Video;
        }
      }
    }
    
    if (!rawVideoData) {
      console.log('❌ Não foi possível extrair dados de vídeo');
      return null;
    }
    
    console.log('🔍 Dados brutos do vídeo:', rawVideoData);
    
    // Limpar URL mal formada
    const cleanedUrl = cleanMalformedUrl(rawVideoData);
    if (!cleanedUrl) {
      console.log('❌ URL limpa resultou em null');
      return null;
    }
    
    console.log('✅ URL limpa:', cleanedUrl);
    
    // Validar e extrair ID
    return validateYouTubeId(cleanedUrl);
  };
  
  // 🎯 VALIDAÇÃO ESTRITA DO YOUTUBE ID
  const validateYouTubeId = (input) => {
    if (!input || typeof input !== 'string') return null;
    
    const trimmed = input.trim();
    
    // Padrão 1: ID direto (11 caracteres)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      // Verificar se não é um ID conhecido como inválido
      const knownInvalidIds = ['undefined', 'null', '00000000000'];
      if (knownInvalidIds.includes(trimmed)) {
        console.log('❌ ID conhecido como inválido:', trimmed);
        return null;
      }
      console.log('✅ Video ID direto válido:', trimmed);
      return trimmed;
    }
    
    // Padrão 2: Extrair de URLs válidas
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:&|$)/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\?|$)/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:\?|$)/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})(?:\?|$)/
    ];
    
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        console.log('✅ Video ID extraído:', match[1]);
        return match[1];
      }
    }
    
    console.log('❌ Formato não reconhecido:', trimmed);
    return null;
  };
  
  // 🖼️ TESTAR THUMBNAILS COM FALLBACK
  const testThumbnail = async (videoId) => {
    const qualities = ['maxresdefault', 'hqdefault', 'mqdefault', 'default'];
    
    for (const quality of qualities) {
      const url = `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'no-cors' // Evita CORS issues
        });
        
        // Com no-cors não podemos verificar status, então assumimos que existe
        console.log('✅ Usando thumbnail:', url);
        return url;
      } catch (error) {
        console.log('⚠️ Erro ao testar thumbnail:', quality);
      }
    }
    
    // Fallback para thumbnail padrão
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  };
  
  // 📊 BUSCAR METADADOS DO VÍDEO
  const fetchVideoMetadata = async (videoId) => {
    try {
      // Tentar API oEmbed do YouTube
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          title: data.title || `Tour virtual - ${imovel.Empreendimento}`,
          author: data.author_name || 'NPI Consultoria',
          authorUrl: data.author_url || 'https://www.npiconsultoria.com.br',
          // YouTube oEmbed não retorna duração, usar estimativa
          duration: estimateVideoDuration(),
          uploadDate: imovel.DataCadastro || new Date().toISOString(),
          description: generateVideoDescription()
        };
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar metadados, usando fallback');
    }
    
    // Metadados fallback
    return {
      title: `Tour virtual - ${imovel.Empreendimento}`,
      author: 'NPI Consultoria',
      authorUrl: 'https://www.npiconsultoria.com.br',
      duration: 'PT2M30S', // 2:30 padrão
      uploadDate: imovel.DataCadastro || new Date().toISOString(),
      description: generateVideoDescription()
    };
  };
  
  // 🎯 GERAR DESCRIÇÃO OTIMIZADA PARA SEO
  const generateVideoDescription = () => {
    const tipo = imovel.TipoImovel || 'Imóvel';
    const cidade = imovel.Cidade || 'São Paulo';
    const bairro = imovel.Bairro || '';
    
    let description = `Tour virtual completo do ${imovel.Empreendimento}. `;
    description += `${tipo} de alto padrão `;
    
    // Adicionar informações de quartos e suítes
    if (imovel.Quartos) {
      description += `com ${imovel.Quartos} ${imovel.Quartos > 1 ? 'quartos' : 'quarto'} `;
    }
    if (imovel.Suites) {
      description += `(${imovel.Suites} ${imovel.Suites > 1 ? 'suítes' : 'suíte'}) `;
    }
    if (imovel.AreaUtil) {
      description += `e ${imovel.AreaUtil}m² de área útil `;
    }
    
    if (bairro) description += `localizado no ${bairro}, `;
    description += `${cidade}/SP. `;
    
    // Adicionar preço se disponível
    if (imovel.Valor) {
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
      }).format(imovel.Valor);
      description += `Valor: ${valorFormatado}. `;
    }
    
    if (imovel.DescricaoCompleta) {
      // Adicionar primeiras 150 caracteres da descrição
      const cleanDesc = imovel.DescricaoCompleta
        .replace(/<[^>]*>/g, '') // Remove HTML
        .substring(0, 150);
      description += cleanDesc + '...';
    } else {
      description += 'Conheça todos os detalhes, acabamentos e diferenciais deste imóvel exclusivo.';
    }
    
    return description;
  };
  
  // 🕐 ESTIMAR DURAÇÃO DO VÍDEO (ISO 8601)
  const estimateVideoDuration = () => {
    // Baseado no tipo de imóvel, estimar duração
    const tipo = imovel.TipoImovel?.toLowerCase() || '';
    
    if (tipo.includes('casa') || tipo.includes('mansão')) {
      return 'PT5M'; // 5 minutos para casas
    } else if (tipo.includes('cobertura')) {
      return 'PT4M'; // 4 minutos para coberturas  
    } else if (tipo.includes('studio') || tipo.includes('kitnet')) {
      return 'PT2M'; // 2 minutos para studios
    } else if (imovel.Quartos >= 4) {
      return 'PT4M30S'; // 4:30 para imóveis grandes
    }
    
    return 'PT3M'; // 3 minutos padrão
  };
  
  // Extrair e validar Video ID
  const videoId = extractVideoId();
  
  // 🔄 CARREGAR METADADOS E THUMBNAIL
  useEffect(() => {
    if (videoId) {
      console.log('📹 Carregando dados para videoId:', videoId);
      setThumbnailLoading(true);
      
      Promise.all([
        testThumbnail(videoId),
        fetchVideoMetadata(videoId)
      ]).then(([thumbnail, metadata]) => {
        setThumbnailUrl(thumbnail);
        setVideoMetadata(metadata);
        setThumbnailLoading(false);
      }).catch(error => {
        console.error('❌ Erro ao carregar dados do vídeo:', error);
        setThumbnailLoading(false);
      });
    }
  }, [videoId]);
  
  // Não renderizar se não houver vídeo válido
  if (!videoId) {
    console.log('⚠️ Componente não renderizado - sem Video ID válido');
    return null;
  }
  
  // URLs do vídeo
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const embedUrlWithParams = `${embedUrl}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // 🚨 STRUCTURED DATA COMPLETO (VideoObject Schema.org)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": videoMetadata?.title || `Tour virtual - ${imovel.Empreendimento}`,
    "description": videoMetadata?.description || generateVideoDescription(),
    "thumbnailUrl": [
      thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
    ],
    "uploadDate": videoMetadata?.uploadDate || new Date().toISOString(),
    "duration": videoMetadata?.duration || 'PT3M',
    "contentUrl": watchUrl,
    "embedUrl": embedUrl,
    "potentialAction": {
      "@type": "WatchAction",
      "target": watchUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "NPI Consultoria",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.npiconsultoria.com.br/logo.png",
        "width": 600,
        "height": 60
      }
    },
    "author": {
      "@type": "Organization",
      "name": videoMetadata?.author || "NPI Consultoria",
      "url": videoMetadata?.authorUrl || "https://www.npiconsultoria.com.br"
    }
  };
  
  // Adicionar informações do imóvel ao structured data
  if (imovel) {
    structuredData["about"] = {
      "@type": "RealEstateListing",
      "name": imovel.Empreendimento,
      "description": imovel.DescricaoCompleta || imovel.Descricao,
      "numberOfRooms": imovel.Quartos,
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": imovel.AreaUtil,
        "unitCode": "MTK" // Metro quadrado
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": imovel.Endereco || "",
        "addressLocality": imovel.Cidade || "São Paulo",
        "addressRegion": "SP",
        "addressCountry": "BR"
      }
    };
    
    // Adicionar preço se disponível
    if (imovel.Valor) {
      structuredData["about"]["offers"] = {
        "@type": "Offer",
        "price": imovel.Valor,
        "priceCurrency": "BRL"
      };
    }
  }
  
  // Adicionar ao contexto da página se disponível
  if (typeof window !== 'undefined') {
    structuredData["@id"] = `${window.location.href}#video`;
    structuredData["isPartOf"] = {
      "@type": "WebPage",
      "@id": window.location.href
    };
  }
  
  console.log('✅ Structured Data gerado:', structuredData);

  return (
    <>
      {/* STRUCTURED DATA JSON-LD */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(structuredData) 
        }} 
      />
      
      <div className="bg-white container mx-auto p-4 md:p-10 mt-4 border-t-2">
        <h2 className="text-2xl font-bold text-gray-900 mb-6" id="video">
          Vídeo {imovel?.Empreendimento || 'do Empreendimento'}
        </h2>
        
        {/* Container do Player */}
        <div className="relative w-full pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-lg">
          {videoLoaded ? (
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={embedUrlWithParams}
              title={videoMetadata?.title || `Tour virtual - ${imovel.Empreendimento}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <button
              onClick={() => setVideoLoaded(true)}
              className="absolute top-0 left-0 w-full h-full cursor-pointer group bg-black rounded-lg overflow-hidden"
              aria-label={`Reproduzir vídeo: ${videoMetadata?.title || imovel.Empreendimento}`}
              type="button"
            >
              {/* Thumbnail ou Loading */}
              {thumbnailLoading ? (
                <div className="flex items-center justify-center h-full bg-gray-900">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                    <p>Carregando preview...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Thumbnail */}
                  {thumbnailUrl && (
                    <img
                      src={thumbnailUrl}
                      alt={`Preview: ${imovel.Empreendimento}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  
                  {/* Overlay escuro */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-opacity duration-300" />
                  
                  {/* Botão Play */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 hover:bg-red-700 rounded-full p-6 transition-all duration-300 transform group-hover:scale-110 shadow-2xl">
                      <svg className="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Badge YouTube */}
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube
                  </div>
                  
                  {/* Informações do imóvel */}
                  {imovel && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-2 rounded-md text-xs max-w-[200px]">
                      <p className="font-semibold truncate">{imovel.Empreendimento}</p>
                      {imovel.Quartos && (
                        <p>{imovel.Quartos} {imovel.Quartos > 1 ? 'quartos' : 'quarto'}</p>
                      )}
                      {imovel.AreaUtil && (
                        <p>{imovel.AreaUtil}m²</p>
                      )}
                    </div>
                  )}
                  
                  {/* Título no rodapé */}
                  {videoMetadata?.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6">
                      <h3 className="text-white font-semibold text-lg line-clamp-2">
                        {videoMetadata.title}
                      </h3>
                      {videoMetadata.author && (
                        <p className="text-white/80 text-sm mt-1">
                          por {videoMetadata.author}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </button>
          )}
        </div>
        
        {/* Link externo para YouTube */}
        <div className="mt-6 text-center">
          <a 
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
            </svg>
            Assistir no YouTube
          </a>
        </div>
      </div>
    </>
  );
}
