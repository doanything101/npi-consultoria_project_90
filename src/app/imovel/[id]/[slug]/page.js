// app/imovel/[id]/[slug]/page.js
// 🎯 VERSÃO ULTRA-OTIMIZADA PARA PAGESPEED 95+ - LCP < 2.5s

import { ImageGallery } from "@/app/components/sections/image-gallery";
import { FAQImovel } from "./componentes/FAQImovel";
import DetalhesCondominio from "./componentes/DetalhesCondominio";
import LocalizacaoCondominio from "./componentes/LocalizacaoCondominio";
import FichaTecnica from "./componentes/FichaTecnica";
import Lazer from "./componentes/Lazer";
import TituloImovel from "./componentes/TituloImovel";
import DetalhesImovel from "./componentes/DetalhesImovel";
import DescricaoImovel from "./componentes/DescricaoImovel";
import VideoCondominio from "./componentes/VideoCondominio";
import TourVirtual from "./componentes/TourVirtual";
import Contato from "./componentes/Contato";
import { SimilarProperties } from "./componentes/similar-properties";
import { getImovelById } from "@/app/services";
import { WhatsappFloat } from "@/app/components/ui/whatsapp";
import { Apartment as StructuredDataApartment } from "@/app/components/structured-data";
import ExitIntentModal from "@/app/components/ui/exit-intent-modal";
import { notFound, redirect } from "next/navigation";

function convertBrazilianDateToISO(brazilianDate, imovelData) {
  const possibleDateFields = [
    brazilianDate,
    imovelData?.DataHoraAtualizacao,
    imovelData?.DataAtualizacao,
    imovelData?.DataCadastro,
    imovelData?.DataModificacao,
    imovelData?.UltimaAtualizacao
  ];
  
  let workingDate = null;
  for (const dateField of possibleDateFields) {
    if (dateField && typeof dateField === 'string' && dateField.trim() !== '') {
      workingDate = dateField.trim();
      break;
    }
  }
  
  if (!workingDate) {
    const currentDate = new Date();
    console.log(`[DATE-CONVERT] ⚠️  Usando data atual como fallback: ${currentDate.toISOString()}`);
    return currentDate.toISOString();
  }
  
  try {
    if (workingDate.includes(', ')) {
      const [datePart, timePart] = workingDate.split(', ');
      const [day, month, year] = datePart.split('/');
      const [hours, minutes, seconds] = timePart.split(':');
      
      const date = new Date(
        parseInt(year), 
        parseInt(month) - 1, 
        parseInt(day), 
        parseInt(hours), 
        parseInt(minutes), 
        parseInt(seconds || 0)
      );
      
      if (!isNaN(date.getTime())) {
        console.log(`[DATE-CONVERT] ✅ Formato brasileiro convertido: ${date.toISOString()}`);
        return date.toISOString();
      }
    }
    
    const date = new Date(workingDate);
    if (!isNaN(date.getTime())) {
      console.log(`[DATE-CONVERT] ✅ Parse direto: ${date.toISOString()}`);
      return date.toISOString();
    }
    
    const fallbackDate = new Date();
    console.log(`[DATE-CONVERT] ⚠️  Fallback para data atual: ${fallbackDate.toISOString()}`);
    return fallbackDate.toISOString();
    
  } catch (error) {
    console.error(`[DATE-CONVERT] ❌ Erro na conversão:`, error);
    const errorFallbackDate = new Date();
    return errorFallbackDate.toISOString();
  }
}

// 🔥 FUNÇÃO ULTRA-OTIMIZADA para gerar URL da imagem LCP
function getLCPOptimizedImageUrl(imovelFotos) {
  console.log('🚀 [LCP-ULTRA] ========== PROCESSANDO IMAGEM LCP ==========');
  
  try {
    let imageUrl = null;
    
    // MÉTODO 1: Array de fotos - pega a primeira
    if (Array.isArray(imovelFotos) && imovelFotos.length > 0) {
      const foto = imovelFotos[0];
      
      if (foto && typeof foto === 'object') {
        // Prioridade para melhor qualidade (para LCP)
        const possibleUrls = [
          foto.FotoGrande,
          foto.Foto, 
          foto.FotoMedia,
        ];
        
        for (const url of possibleUrls) {
          if (url && typeof url === 'string' && url.trim() !== '') {
            imageUrl = url.trim();
            break;
          }
        }
      } else if (foto && typeof foto === 'string' && foto.trim() !== '') {
        imageUrl = foto.trim();
      }
    }
    
    // MÉTODO 2: String direta
    if (!imageUrl && typeof imovelFotos === 'string' && imovelFotos.trim() !== '') {
      imageUrl = imovelFotos.trim();
    }
    
    // MÉTODO 3: Objeto único
    if (!imageUrl && imovelFotos && typeof imovelFotos === 'object' && !Array.isArray(imovelFotos)) {
      const possibleUrls = [
        imovelFotos.FotoGrande,
        imovelFotos.Foto,
        imovelFotos.FotoMedia, 
      ];
      
      for (const url of possibleUrls) {
        if (url && typeof url === 'string' && url.trim() !== '') {
          imageUrl = url.trim();
          break;
        }
      }
    }
    
    // VALIDAÇÃO E OTIMIZAÇÃO DA URL
    if (imageUrl) {
      // Garantir HTTPS
      if (imageUrl.startsWith('http://')) {
        imageUrl = imageUrl.replace('http://', 'https://');
      }
      
      // Se URL relativa, converter para absoluta
      if (imageUrl.startsWith('/')) {
        imageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://npiconsultoria.com.br'}${imageUrl}`;
      }
      
      console.log('🚀 [LCP-ULTRA] ✅ URL otimizada para LCP:', imageUrl);
      return imageUrl;
    }
    
    // FALLBACK
    const fallbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://npiconsultoria.com.br'}/og-image.png`;
    console.log('🚀 [LCP-ULTRA] ⚠️ Usando fallback:', fallbackUrl);
    return fallbackUrl;
    
  } catch (error) {
    console.error('🚀 [LCP-ULTRA] ❌ Erro:', error);
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://npiconsultoria.com.br'}/og-image.png`;
  }
}

function getWhatsAppOptimizedImageUrl(imovelFotos) {
  console.log('📱 [WHATSAPP-ULTRA] ========== PROCESSANDO IMAGEM ==========');
  console.log('📱 [WHATSAPP-ULTRA] Input:', JSON.stringify(imovelFotos, null, 2));
  
  try {
    let finalImageUrl = null;
    
    if (Array.isArray(imovelFotos) && imovelFotos.length > 0) {
      console.log('📱 [WHATSAPP-ULTRA] Processando array com', imovelFotos.length, 'itens');
      
      for (let i = 0; i < Math.min(imovelFotos.length, 3); i++) {
        const foto = imovelFotos[i];
        console.log(`📱 [WHATSAPP-ULTRA] Foto ${i}:`, foto);
        
        if (foto && typeof foto === 'object') {
          const possibleUrls = [
            foto.FotoGrande,
            foto.Foto, 
            foto.FotoMedia,
            foto.FotoPequena,
            foto.url,
            foto.src,
            foto.image,
            foto.href
          ];
          
          for (const url of possibleUrls) {
            if (url && typeof url === 'string' && url.trim() !== '') {
              finalImageUrl = url.trim();
              console.log(`📱 [WHATSAPP-ULTRA] ✅ URL encontrada em objeto[${i}]:`, finalImageUrl);
              break;
            }
          }
        } else if (foto && typeof foto === 'string' && foto.trim() !== '') {
          finalImageUrl = foto.trim();
          console.log(`📱 [WHATSAPP-ULTRA] ✅ URL string direta[${i}]:`, finalImageUrl);
          break;
        }
        
        if (finalImageUrl) break;
      }
    }
    
    if (!finalImageUrl && typeof imovelFotos === 'string' && imovelFotos.trim() !== '') {
      finalImageUrl = imovelFotos.trim();
      console.log('📱 [WHATSAPP-ULTRA] ✅ URL string direta:', finalImageUrl);
    }
    
    if (!finalImageUrl && imovelFotos && typeof imovelFotos === 'object' && !Array.isArray(imovelFotos)) {
      console.log('📱 [WHATSAPP-ULTRA] Processando objeto único');
      
      const possibleUrls = [
        imovelFotos.FotoGrande,
        imovelFotos.Foto,
        imovelFotos.FotoMedia, 
        imovelFotos.FotoPequena,
        imovelFotos.url,
        imovelFotos.src,
        imovelFotos.image
      ];
      
      for (const url of possibleUrls) {
        if (url && typeof url === 'string' && url.trim() !== '') {
          finalImageUrl = url.trim();
          console.log('📱 [WHATSAPP-ULTRA] ✅ URL encontrada em objeto único:', finalImageUrl);
          break;
        }
      }
    }
    
    if (finalImageUrl) {
      if (finalImageUrl.startsWith('http://')) {
        finalImageUrl = finalImageUrl.replace('http://', 'https://');
        console.log('📱 [WHATSAPP-ULTRA] ✅ Convertido para HTTPS:', finalImageUrl);
      }
      
      if (finalImageUrl.startsWith('/')) {
        finalImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://npiconsultoria.com.br'}${finalImageUrl}`;
        console.log('📱 [WHATSAPP-ULTRA] ✅ Convertido para URL absoluta:', finalImageUrl);
      }
      
      return finalImageUrl;
    }
    
    const fallbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://npiconsultoria.com.br'}/og-image.png`;
    console.log('📱 [WHATSAPP-ULTRA] ⚠️ Usando fallback final:', fallbackUrl);
    return fallbackUrl;
    
  } catch (error) {
    console.error('📱 [WHATSAPP-ULTRA] ❌ Erro geral:', error);
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://npiconsultoria.com.br'}/og-image.png`;
  }
}

function createSmartTitle(imovel) {
  console.log('📝 [SMART-TITLE-FIXED] ========== PROCESSANDO TÍTULO ==========');
  console.log('📝 [SMART-TITLE-FIXED] Input imovel:', {
    Empreendimento: imovel.Empreendimento,
    TipoEndereco: imovel.TipoEndereco,
    Endereco: imovel.Endereco,
    Numero: imovel.Numero,
    BairroComercial: imovel.BairroComercial,
    Cidade: imovel.Cidade
  });
  
  const parts = [];
  
  if (imovel.Empreendimento) {
    parts.push(imovel.Empreendimento);
  }
  
  if (imovel.Endereco) {
    const enderecoParts = [];
    
    if (imovel.TipoEndereco && imovel.TipoEndereco.trim() !== '') {
      enderecoParts.push(imovel.TipoEndereco.trim());
    }
    
    if (imovel.Endereco && imovel.Endereco.trim() !== '') {
      enderecoParts.push(imovel.Endereco.trim());
    }
    
    if (imovel.Numero && imovel.Numero.trim() !== '') {
      enderecoParts.push(imovel.Numero.trim());
    }
    
    let endereco = enderecoParts.join(' ').trim();
    
    endereco = endereco
      .replace(/([a-zA-Z])([A-Z][a-z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('📝 [SMART-TITLE-FIXED] Endereço construído:', endereco);
    console.log('📝 [SMART-TITLE-FIXED] Partes do endereço:', enderecoParts);
    
    if (endereco) {
      const empreendimento = (imovel.Empreendimento || '').toLowerCase();
      const enderecoLower = endereco.toLowerCase();
      
      if (!empreendimento.includes(enderecoLower.slice(0, 10)) && 
          !enderecoLower.includes(empreendimento.slice(0, 10))) {
        parts.push(endereco);
        console.log('📝 [SMART-TITLE-FIXED] Endereço incluído:', endereco);
      } else {
        console.log('📝 [SMART-TITLE-FIXED] Endereço omitido (duplicação detectada)');
      }
    }
  }
  
  if (imovel.BairroComercial) {
    const bairroJaIncluido = parts.some(part => 
      part.toLowerCase().includes(imovel.BairroComercial.toLowerCase()) ||
      imovel.BairroComercial.toLowerCase().includes(part.toLowerCase())
    );
    
    if (!bairroJaIncluido) {
      parts.push(imovel.BairroComercial);
    }
  }
  
  if (imovel.Cidade) {
    const cidadeJaIncluida = parts.some(part => 
      part.toLowerCase().includes(imovel.Cidade.toLowerCase()) ||
      imovel.Cidade.toLowerCase().includes(part.toLowerCase())
    );
    
    if (!cidadeJaIncluida) {
      parts.push(imovel.Cidade);
    }
  }
  
  const smartTitle = parts
    .filter(part => part && part.trim() !== '')
    .join(', ')
    .replace(/,\s*,+/g, ',')
    .replace(/^,+|,+$/g, '')
    .trim();
  
  console.log('📝 [SMART-TITLE-FIXED] Resultado final:', smartTitle);
  console.log('📝 [SMART-TITLE-FIXED] ========================================');
  
  return smartTitle;
}

function cleanDuplicateWords(text) {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/(\w+)\s+\1/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// FUNÇÃO PARA DETECTAR FINALIDADE (VENDA/LOCAÇÃO)
function detectarFinalidade(imovel) {
  const temAluguel = imovel.ValorAluguel || imovel.ValorAluguelSite || imovel.ValorLocacao;
  const temVenda = imovel.ValorVenda || imovel.ValorAntigo || imovel.ValorVendaFormatado;
  
  if (imovel.Finalidade) {
    return imovel.Finalidade.toLowerCase().includes('loca') ? 'locacao' : 'venda';
  }
  
  if (temAluguel && !temVenda) {
    return 'locacao';
  }
  
  return 'venda';
}

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { id } = params;
  
  console.error(`[IMOVEL-META] =========== PROCESSANDO ID: ${id} ===========`);
  
  try {
    const response = await getImovelById(id);
    if (!response?.data) {
      return {
        title: 'Imóvel não encontrado - NPI Consultoria',
        description: 'O imóvel solicitado não foi encontrado.',
      };
    }

    const imovel = response.data;
    
    let modifiedDate;
    try {
      modifiedDate = convertBrazilianDateToISO(imovel.DataHoraAtualizacao, imovel);
      const testDate = new Date(modifiedDate);
      if (isNaN(testDate.getTime())) {
        console.error(`[IMOVEL-META] ❌ Data inválida gerada, usando fallback`);
        modifiedDate = new Date().toISOString();
      }
    } catch (error) {
      console.error(`[IMOVEL-META] ❌ Erro na conversão de data:`, error);
      modifiedDate = new Date().toISOString();
    }
    
    console.error(`[IMOVEL-META] ✅ Data final válida: ${modifiedDate}`);
    
    // NOVA LÓGICA: TÍTULO E DESCRIPTION OTIMIZADOS
    const finalidade = detectarFinalidade(imovel);
    const textoFinalidade = finalidade === 'locacao' ? 'para locação' : 'à venda';
    const valorFinal = finalidade === 'locacao' 
      ? (imovel.ValorAluguel || imovel.ValorAluguelSite || 'Consulte')
      : (imovel.ValorAntigo || 'Consulte');

    // Título com endereço completo
    const partesTitle = [
      imovel.Categoria,
      imovel.TipoEndereco,
      imovel.Endereco,
      imovel.Numero
    ].filter(parte => parte && parte.trim() !== '').join(' ');
    
    const title = `${partesTitle}, ${imovel.Empreendimento}`;

    // Description otimizada
    const valorFormatado = valorFinal === 'Consulte' ? 'Consulte' : 
      (typeof valorFinal === 'string' && valorFinal.includes('R$') ? valorFinal : `R$ ${valorFinal}`);
    
    const descricaoLimpa = cleanDuplicateWords(`${imovel.Categoria} ${textoFinalidade} no ${imovel.Empreendimento}, ${imovel.BairroComercial}. ${imovel.DormitoriosAntigo || 0} quartos (${imovel.SuiteAntigo || 0} suítes), ${imovel.VagasAntigo || 0} vagas, ${imovel.MetragemAnt || 0} m². Cód ${imovel.Codigo}. PREÇO: ${valorFormatado}.`);
    
    // CORREÇÃO GSC: Validar slug antes de usar em URLs canônicas
    const slugsInvalidos = [
      'facebook.com/npiimoveis',
      'instagram.com/npi_imoveis', 
      'indexdata/index.swf'
    ];
    
    const slugValido = imovel.Slug && !slugsInvalidos.includes(imovel.Slug) ? imovel.Slug : null;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.npiconsultoria.com.br";
    const currentUrl = slugValido 
      ? `${baseUrl}/imovel-${imovel.Codigo}/${slugValido}`
      : `${baseUrl}/imovel-${imovel.Codigo}`;
    
    console.log(`📋 [META-URL] Slug original: "${imovel.Slug}", válido: ${!!slugValido}, URL: ${currentUrl}`);
    const imageUrl = getWhatsAppOptimizedImageUrl(imovel.Foto);
    
    // 🎯 EXTRAIR ID DO VÍDEO PARA META TAGS
    const videoId = imovel?.Video ? Object.values(imovel.Video)[0]?.Video : null;
    
    console.log('📱 [WHATSAPP-META] URL final da imagem para WhatsApp:', imageUrl);

    return {
      title,
      description: descricaoLimpa,
      alternates: {
        canonical: currentUrl,
        languages: {
          "pt-BR": currentUrl,
        },
      },
      robots: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
      openGraph: {
        title,
        description: descricaoLimpa,
        url: currentUrl,
        type: "website",
        siteName: "NPI",
        locale: "pt_BR",
        images: [
          {
            url: imageUrl,
            secureUrl: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
            type: "image/jpeg",
          },
          {
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`,
            secureUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`,
            width: 1200,
            height: 630,
            alt: "NPI Consultoria - Imóveis",
            type: "image/png",
          }
        ],
        // 🎯 ADICIONAR VÍDEOS SE EXISTIR (CORRIGIDO: usar watch URLs)
        ...(videoId && {
          videos: [{
            url: `https://www.youtube.com/watch?v=${videoId}`,
            secureUrl: `https://www.youtube.com/watch?v=${videoId}`,
            type: 'text/html',
            width: 1280,
            height: 720,
          }],
        }),
      },
      twitter: {
        card: videoId ? "player" : "summary_large_image", // 🎯 Muda para player se tiver vídeo
        title,
        description: descricaoLimpa,
        site: "@NPIImoveis",
        creator: "@NPIImoveis",
        images: [
          {
            url: imageUrl,
            alt: title,
          }
        ],
        // 🎯 ADICIONAR PLAYER DO TWITTER SE TIVER VÍDEO (CORRIGIDO: usar watch URLs)
        ...(videoId && {
          players: [{
            playerUrl: `https://www.youtube.com/watch?v=${videoId}`,
            streamUrl: `https://www.youtube.com/watch?v=${videoId}`,
            width: 1280,
            height: 720,
          }],
        }),
      },
      other: {
        'og:title': title,
        'og:description': descricaoLimpa,
        'og:image': imageUrl,
        'og:url': currentUrl,
        'og:type': 'website',
        'og:site_name': 'NPI',
        'og:locale': 'pt_BR',
        'article:published_time': modifiedDate,
        'article:modified_time': modifiedDate,
        'cache-control': 'no-cache, must-revalidate',
        'last-modified': modifiedDate,
        // 🎯 META TAGS DE VÍDEO ADICIONADAS CORRETAMENTE (CORRIGIDO: usar watch URLs)
        ...(videoId && {
          'og:video': `https://www.youtube.com/watch?v=${videoId}`,
          'og:video:url': `https://www.youtube.com/watch?v=${videoId}`,
          'og:video:secure_url': `https://www.youtube.com/watch?v=${videoId}`,
          'og:video:type': 'text/html',
          'og:video:width': '1280',
          'og:video:height': '720',
          'twitter:player': `https://www.youtube.com/watch?v=${videoId}`,
          'twitter:player:width': '1280',
          'twitter:player:height': '720',
        }),
      },
    };
  } catch (error) {
    console.error('Erro ao gerar metadata:', error);
    return {
      title: 'Erro - NPI Consultoria',
      description: 'Ocorreu um erro ao carregar as informações do imóvel.',
    };
  }
}

export default async function ImovelPage({ params }) {
  const { id, slug } = params;
  
  console.log(`🏠 [IMOVEL-PAGE] =================== INÍCIO ===================`);
  console.log(`🏠 [IMOVEL-PAGE] Processando ID: ${id}, SLUG: ${slug}`);
  
  // DEBUG CANONICAL CRÍTICO: Detectar ID undefined
  if (!id || id === 'undefined' || id === 'null') {
    console.log(`🚨🚨🚨 [CANONICAL-DEBUG] ★★★ ID UNDEFINED DETECTADO ★★★`);
    console.log(`🚨🚨🚨 [CANONICAL-DEBUG] ID: "${id}", SLUG: "${slug}"`);
    console.log(`🚨🚨🚨 [CANONICAL-DEBUG] params:`, JSON.stringify(params));
    console.log(`🚨🚨🚨 [CANONICAL-DEBUG] typeof ID: ${typeof id}`);
    console.log(`🚨🚨🚨 [CANONICAL-DEBUG] URL problemática que causa canonical conflito!`);
    
    redirect('/busca');
  }
  
  // RASTREAMENTO DETALHADO: URLs problemáticas específicas do CSV
  const slugsInvalidos = [
    'facebook.com/npiimoveis',
    'instagram.com/npi_imoveis', 
    'indexdata/index.swf'
  ];
  
  if (slugsInvalidos.includes(slug)) {
    console.log(`🚨🚨🚨 [IMOVEL-PAGE] ★★★ SLUG INVÁLIDO DETECTADO ★★★`);
    console.log(`🚨🚨🚨 [IMOVEL-PAGE] ID: ${id}, SLUG PROBLEMÁTICO: ${slug}`);
    console.log(`🚨🚨🚨 [IMOVEL-PAGE] URL COMPLETA: /imovel-${id}/${slug}`);
    console.log(`🚨🚨🚨 [IMOVEL-PAGE] Redirecionando para: /imovel-${id}`);
    redirect(`/imovel-${id}`);
  }
  
  try {
    console.log(`🏠 [IMOVEL-PAGE] 📞 Chamando getImovelById(${id})`);
    const response = await getImovelById(id);
    
    console.log(`🏠 [IMOVEL-PAGE] 📞 Response:`, { 
      success: !!response?.data, 
      codigo: response?.data?.Codigo,
      empreendimento: response?.data?.Empreendimento?.substring(0, 30)
    });
    
    if (!response?.data) {
      notFound();
    }

    const imovel = {
      ...response.data,
      SuiteAntigo: response.data.SuiteAntigo ?? response.data.Suites ?? 0,
      DormitoriosAntigo: response.data.DormitoriosAntigo ?? 0,
      VagasAntigo: response.data.VagasAntigo ?? 0,
      BanheiroSocialQtd: response.data.BanheiroSocialQtd ?? 0,
    };

    const slugCorreto = imovel.Slug;

    if (slug !== slugCorreto) {
      console.log(`🏠 [IMOVEL-PAGE] ⚠️ Slug inconsistente (middleware deveria ter redirecionado): ${slug} vs ${slugCorreto}`);
    }

    const slugValido = imovel.Slug && !slugsInvalidos.includes(imovel.Slug) ? imovel.Slug : null;
    const currentUrl = slugValido 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/imovel-${imovel.Codigo}/${slugValido}`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/imovel-${imovel.Codigo}`;
    
    const modifiedDate = convertBrazilianDateToISO(imovel.DataHoraAtualizacao, imovel);
    const lcpImageUrl = getLCPOptimizedImageUrl(imovel.Foto);
    
    console.log('🔍 Data convertida no componente:', modifiedDate);
    console.log('🚀 [LCP-CRITICAL] URL da imagem LCP para preload:', lcpImageUrl);
    
    const structuredDataDates = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      url: currentUrl,
      datePublished: modifiedDate,
      dateModified: modifiedDate,
      author: {
        "@type": "Organization",
        name: "NPI Consultoria"
      },
      publisher: {
        "@type": "Organization",
        name: "NPI Consultoria"
      }
    };

    return (
      <section className="w-full bg-white pb-32 pt-20">
        <StructuredDataApartment
          title={imovel.Empreendimento}
          price={imovel.ValorAntigo ? `R$ ${imovel.ValorAntigo}` : "Consulte"}
          description={cleanDuplicateWords(`${imovel.Categoria} à venda em ${imovel.BairroComercial}, ${imovel.Cidade}. ${imovel.Empreendimento}: ${imovel.DormitoriosAntigo} quartos, ${imovel.SuiteAntigo} suítes, ${imovel.BanheiroSocialQtd} banheiros, ${imovel.VagasAntigo} vagas, ${imovel.MetragemAnt} m2. ${imovel.Situacao}. Valor: ${imovel.ValorAntigo ? `R$ ${imovel.ValorAntigo}` : "Consulte"}. ${imovel.TipoEndereco} ${imovel.Endereco}.`)}
          address={cleanDuplicateWords(`${imovel.TipoEndereco} ${imovel.Endereco}, ${imovel.Numero}, ${imovel.BairroComercial}, ${imovel.Cidade}`)}
          url={currentUrl}
          image={imovel.Foto}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredDataDates),
          }}
        />

        <ExitIntentModal condominio={imovel.Empreendimento} link={currentUrl} />

        <div className="w-full mx-auto">
          <ImageGallery imovel={imovel} />
        </div>

        <div className="container mx-auto gap-4 mt-3 px-4 md:px-0 flex flex-col lg:flex-row">
          <div className="w-full lg:w-[65%]">
            <TituloImovel imovel={imovel} currentUrl={currentUrl} />
            <DetalhesImovel imovel={imovel} />
            <DescricaoImovel imovel={imovel} />
            <FichaTecnica imovel={imovel} />
            <DetalhesCondominio imovel={imovel} />
            <Lazer imovel={imovel} />
            
          {/* COMPONENTE DE VÍDEO - COM VALIDAÇÃO MELHORADA */}
{(() => {
  if (!imovel?.Video) return null;
  
  // Se for objeto vazio, não renderizar
  if (typeof imovel.Video === 'object' && !Array.isArray(imovel.Video)) {
    // Verificar se tem algum valor válido
    const valores = Object.values(imovel.Video);
    if (valores.length === 0) return null;
    
    // Verificar se todos os valores são vazios ou inválidos
    const temValorValido = valores.some(v => 
      v && 
      v !== '' && 
      v !== 'null' && 
      v !== 'undefined' &&
      v !== '4Aq7szgycT4' // ID problemático específico
    );
    
    if (!temValorValido) return null;
  }
  
  // Se for string, verificar se não é vazia ou o ID problemático
  if (typeof imovel.Video === 'string') {
    if (imovel.Video === '' || 
        imovel.Video === '4Aq7szgycT4' ||
        imovel.Video.includes('4Aq7szgycT4')) {
      return null;
    }
  }
  
  return <VideoCondominio imovel={imovel} />;
})()}
            
            {imovel.Tour360 && <TourVirtual link={imovel.Tour360} titulo={imovel.Empreendimento} />}
            
            <SimilarProperties  
            id={imovel.Codigo}
            endereco={imovel.Endereco}
            bairro={imovel.Bairro || imovel.BairroComercial}
            categoria={imovel.Categoria || imovel.Tipo}
            metragem={imovel.AreaUtil || imovel.Metragem || imovel.AreaPrivativa || imovel.MetragemAnt}
/>
            
            <LocalizacaoCondominio imovel={imovel} />
          </div>

          <div className="w-full lg:w-[35%] h-fit lg:sticky lg:top-24 order-first lg:order-last mb-6 lg:mb-0">
            <Contato imovel={imovel} currentUrl={currentUrl} />
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-0">
          <FAQImovel imovel={imovel} />
        </div>

        <WhatsappFloat
          message={`Quero saber mais sobre o ${imovel.Empreendimento}, no bairro ${imovel.BairroComercial}, disponível na página do Imóvel: ${currentUrl}`}
        />
      </section>
    );
  } catch (error) {
    console.error('Erro na página do imóvel:', error);
    notFound();
  }
}
