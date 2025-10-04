// src/app/(site)/[slug]/page.js - AJUSTE CIRÚRGICO PARA FOTOS VERTICAIS

import { Button } from "@/app/components/ui/button";
import { getCondominioPorSlug } from "@/app/services";
import { formatterValue } from "@/app/utils/formatter-value";
import { Apartment as StructuredDataApartment } from "@/app/components/structured-data";
import { Share } from "@/app/components/ui/share";
import { PropertyTableOwner } from "./componentes/property-table-owner";
import { WhatsappFloat } from "@/app/components/ui/whatsapp";
import { PropertyTable } from "./componentes/property-table";
import { ImoveisRelacionados } from "./componentes/related-properties";
import SobreCondominio from "./componentes/SobreCondominio";
import FichaTecnica from "./componentes/FichaTecnica";
import DiferenciaisCondominio from "./componentes/DiferenciaisCondominio";
import DetalhesCondominio from "./componentes/DetalhesCondominio";
import Lazer from "./componentes/Lazer";
import VideoCondominio from "./componentes/VideoCondominio";
import TourVirtual from "./componentes/TourVirtual";
import ExploreRegiao from "./componentes/ExploreRegiao";
import { notFound, redirect } from "next/navigation";
import ExitIntentModal from "@/app/components/ui/exit-intent-modal";
import ScrollToImoveisButton from "./componentes/scroll-to-imovel-button";
import { photoSorter } from "@/app/utils/photoSorter"; 
import { ImageGallery } from "@/app/components/sections/image-gallery";

function ensureCondominio(text) {
  return /condom[ií]nio/i.test(text) ? text : `Condomínio ${text}`;
}

// 🎯 NOVA FUNÇÃO: DETECTAR ORIENTAÇÃO DA FOTO PRINCIPAL
function detectarOrientacaoFoto(fotosOrdenadas) {
  if (!fotosOrdenadas || fotosOrdenadas.length === 0) {
    console.log('🔍 DETECÇÃO: Nenhuma foto encontrada, usando VERTICAL por padrão');
    return 'vertical'; // 🎯 MUDANÇA: Padrão agora é VERTICAL
  }

  const primeiraFoto = fotosOrdenadas[0];
  if (!primeiraFoto?.Foto) {
    console.log('🔍 DETECÇÃO: Primeira foto sem URL, usando VERTICAL por padrão');
    return 'vertical'; // 🎯 MUDANÇA: Padrão agora é VERTICAL
  }

  console.log('🔍 DETECÇÃO: Analisando foto:', primeiraFoto.Foto);
  console.log('🔍 DETECÇÃO: Metadados da foto:', {
    Largura: primeiraFoto.Largura,
    Altura: primeiraFoto.Altura,
    FotoPequena: primeiraFoto.FotoPequena
  });

  // 1️⃣ PRIORIDADE: Usar dimensões reais se disponíveis
  if (primeiraFoto.Largura && primeiraFoto.Altura) {
    const largura = parseInt(primeiraFoto.Largura);
    const altura = parseInt(primeiraFoto.Altura);
    const ratio = largura / altura;
    const orientacao = ratio < 0.8 ? 'vertical' : 'horizontal'; // 🎯 MAIS AGRESSIVO: ratio < 0.8
    console.log('🔍 DETECÇÃO: Por dimensões -', `${largura}x${altura}`, 'ratio:', ratio.toFixed(2), '→', orientacao);
    return orientacao;
  }

  // 2️⃣ ESTRATÉGIA INVERSA: Procurar padrões que indicam HORIZONTAL
  const fotoUrl = primeiraFoto.Foto.toLowerCase();
  
  // Padrões que indicam que a foto é HORIZONTAL
  const padroesHorizontais = [
    'horizontal', 'landscape', 'wide', 'banner', 'panoramic',
    'sala', 'living', 'cozinha', 'quarto', 'bedroom', 'kitchen',
    'interior', 'inside', 'room', 'varanda', 'balcony'
  ];
  
  const isHorizontal = padroesHorizontais.some(padrao => fotoUrl.includes(padrao));
  
  if (isHorizontal) {
    console.log('🔍 DETECÇÃO: Padrão HORIZONTAL detectado na URL →', 'horizontal');
    return 'horizontal';
  }

  // 3️⃣ PADRÃO: Se não tem certeza que é horizontal, assume VERTICAL
  // (porque a maioria das fotos de fachada de prédios são verticais)
  console.log('🔍 DETECÇÃO: Nenhum padrão horizontal encontrado → assumindo VERTICAL');
  return 'vertical';
}

// 🎯 FUNÇÃO PARA ORDENAR FOTOS DO CONDOMÍNIO (igual ao admin que funcionou)
function processarFotosCondominio(fotos, codigoCondominio) {
  if (!Array.isArray(fotos) || fotos.length === 0) {
    console.log('📸 CONDOMÍNIO: Nenhuma foto para processar');
    return [];
  }

  try {
    console.log('📝 CONDOMÍNIO: Iniciando ordenação com photoSorter...', {
      totalFotos: fotos.length,
      codigo: codigoCondominio
    });
    
    // 🎯 FORÇAR photoSorter a usar SEMPRE Análise Inteligente (igual ao admin)
    const fotosTemp = fotos.map(foto => {
      // Remover campos ORDEM para forçar análise inteligente
      const { Ordem, ordem, ORDEM, ...fotoSemOrdem } = foto;
      return fotoSemOrdem;
    });
    
    // EXATAMENTE IGUAL AO ADMIN QUE FUNCIONOU - usar photoSorter.ordenarFotos() 
    const fotosOrdenadas = photoSorter.ordenarFotos(fotosTemp, codigoCondominio || 'condominio');
    
    console.log('✅ CONDOMÍNIO: Ordenação finalizada usando photoSorter:', {
      totalFotos: fotosOrdenadas.length,
      primeira: fotosOrdenadas[0]?.Foto?.split('/').pop()?.substring(0, 30) + '...',
      metodo: 'photoSorter.ordenarFotos() - IGUAL AO ADMIN'
    });

    return fotosOrdenadas;

  } catch (error) {
    console.error('❌ CONDOMÍNIO: Erro ao usar photoSorter:', error);
    
    // Fallback seguro - retornar fotos originais
    return fotos;
  }
}

// 🎯 FUNÇÃO PARA LIMPAR DECIMAIS DESNECESSÁRIOS DA METRAGEM
function limparMetragem(valor) {
  if (!valor) return valor;
  
  // Se for string, converter para número e formatar
  if (typeof valor === 'string') {
    // Remover qualquer formatação existente e converter
    const numero = parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.'));
    
    if (isNaN(numero)) return valor;
    
    // Se é número inteiro, não mostrar decimais
    if (numero === Math.floor(numero)) {
      return numero.toString();
    }
    
    // Se tem decimais significativos, manter apenas 1 casa
    return numero.toFixed(1).replace('.0', '');
  }
  
  // Se for número
  if (typeof valor === 'number') {
    // Se é inteiro, retornar sem decimais
    if (valor === Math.floor(valor)) {
      return valor.toString();
    }
    
    // Se tem decimais, manter apenas 1 casa significativa
    return valor.toFixed(1).replace('.0', '');
  }
  
  return valor;
}

// 🎯 FUNÇÃO PARA PROCESSAR E LIMPAR DADOS DOS IMÓVEIS
function processarDadosImoveis(imoveis) {
  if (!Array.isArray(imoveis)) return imoveis;
  
  return imoveis.map(imovel => {
    // Criar cópia do imóvel para não alterar o original
    const imovelProcessado = { ...imovel };
    
    // Limpar campos de metragem
    const camposMetragem = [
      'Metragem',
      'MetragemTotal', 
      'MetragemPrivativa',
      'MetragemAnt',
      'AreaTotal',
      'AreaPrivativa',
      'Area'
    ];
    
    camposMetragem.forEach(campo => {
      if (imovelProcessado[campo]) {
        const valorOriginal = imovelProcessado[campo];
        const valorLimpo = limparMetragem(valorOriginal);
        
        if (valorOriginal !== valorLimpo) {
          console.log(`🧹 METRAGEM LIMPA: ${campo} ${valorOriginal} → ${valorLimpo} (Código: ${imovel.Codigo})`);
        }
        
        imovelProcessado[campo] = valorLimpo;
      }
    });
    
    return imovelProcessado;
  });
}

// 🎯 FUNÇÃO PARA ORDENAR IMÓVEIS RELACIONADOS
// Coloca o imóvel principal primeiro + demais por valor (menor → maior)
function ordenarImoveisRelacionados(imoveisRelacionados, codigoPrincipal) {
  if (!Array.isArray(imoveisRelacionados) || imoveisRelacionados.length === 0) {
    console.log('📋 ORDENAÇÃO: Nenhum imóvel relacionado para ordenar');
    return [];
  }

  try {
    console.log('🎯 ORDENAÇÃO: Iniciando ordenação de imóveis relacionados', {
      totalImoveis: imoveisRelacionados.length,
      codigoPrincipal: codigoPrincipal
    });

    // 1️⃣ SEPARAR IMÓVEL PRINCIPAL DOS DEMAIS
    const imovelPrincipal = imoveisRelacionados.find(imovel => 
      imovel.Codigo === codigoPrincipal || 
      imovel.Codigo === parseInt(codigoPrincipal) ||
      imovel.CodigoImovel === codigoPrincipal ||
      imovel.CodigoImovel === parseInt(codigoPrincipal)
    );

    const demaisImoveis = imoveisRelacionados.filter(imovel => 
      imovel.Codigo !== codigoPrincipal && 
      imovel.Codigo !== parseInt(codigoPrincipal) &&
      imovel.CodigoImovel !== codigoPrincipal &&
      imovel.CodigoImovel !== parseInt(codigoPrincipal)
    );

    console.log('🔍 ORDENAÇÃO: Separação concluída', {
      imovelPrincipalEncontrado: !!imovelPrincipal,
      codigoImovelPrincipal: imovelPrincipal?.Codigo || imovelPrincipal?.CodigoImovel,
      demaisImoveis: demaisImoveis.length
    });

    // 2️⃣ ORDENAR DEMAIS IMÓVEIS POR VALOR (MENOR → MAIOR)
    const demaisOrdenados = demaisImoveis.sort((a, b) => {
      // Função para extrair valor numérico melhorada
      const extrairValor = (imovel) => {
        // Tentar diferentes campos de valor (ordem de prioridade)
        const valorBruto = imovel.ValorVenda || 
                          imovel.ValorAntigo || 
                          imovel.Valor || 
                          imovel.PrecoVenda ||
                          imovel.ValorVendaFormatado ||
                          imovel.ValorVendaSite ||
                          '0';
        
        // Se for número, retornar direto
        if (typeof valorBruto === 'number') {
          return valorBruto;
        }
        
        // Se for string, fazer limpeza mais robusta
        if (typeof valorBruto === 'string') {
          // Remover R$, pontos, espaços, deixar apenas números e vírgula
          let valorLimpo = valorBruto
            .replace(/R\$?\s*/g, '')           // Remove R$ e espaços
            .replace(/\./g, '')               // Remove pontos (separadores de milhares)
            .replace(/,/g, '.')               // Troca vírgula por ponto decimal
            .replace(/[^\d.-]/g, '')          // Remove qualquer outro caractere
            .trim();
          
          const valorNumerico = parseFloat(valorLimpo) || 0;
          
          return valorNumerico;
        }
        
        return 0;
      };

      const valorA = extrairValor(a);
      const valorB = extrairValor(b);

      return valorA - valorB; // Ordem crescente (menor → maior)
    });

    // 3️⃣ MONTAR ARRAY FINAL: PRINCIPAL PRIMEIRO + DEMAIS ORDENADOS
    const imoveisOrdenados = [];
    
    if (imovelPrincipal) {
      imoveisOrdenados.push(imovelPrincipal);
    }
    
    imoveisOrdenados.push(...demaisOrdenados);

    console.log('✅ ORDENAÇÃO: Finalizada com sucesso', {
      totalFinal: imoveisOrdenados.length,
      primeiroEhPrincipal: imoveisOrdenados[0]?.Codigo === codigoPrincipal || 
                          imoveisOrdenados[0]?.CodigoImovel === codigoPrincipal,
      ordemValores: imoveisOrdenados.slice(1, 4).map(i => {
        const valor = i.ValorVenda || i.ValorAntigo || i.Valor || 0;
        return typeof valor === 'string' ? valor.substring(0, 15) + '...' : valor;
      })
    });

    // 🧹 APLICAR LIMPEZA DE METRAGEM EM TODOS OS IMÓVEIS
    return processarDadosImoveis(imoveisOrdenados);

  } catch (error) {
    console.error('❌ ORDENAÇÃO: Erro ao ordenar imóveis relacionados:', error);
    
    // Fallback seguro - retornar array original com limpeza aplicada
    return processarDadosImoveis(imoveisRelacionados);
  }
}

export async function generateMetadata({ params }) {
  const { slug } = params;
  
  // Detectar URLs que sigam o padrão imovel-{id} - permitir indexação
  if (slug.match(/^imovel-(\d+)$/)) {
    return {
      title: "Imóvel - NPI Consultoria",
      description: "Imóvel de alto padrão disponível na NPI Consultoria",
      robots: { 
        index: true, 
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      }
    };
  }
  
  const response = await getCondominioPorSlug(slug);
  const condominio = response?.data;

  if (!condominio) {
    return {
      title: "Condomínio não encontrado",
      description: "A página do condomínio que você procura não foi encontrada.",
      robots: "noindex, nofollow",
    };
  }

  const rawTitle = ensureCondominio(condominio.Empreendimento);
  
  // 🎯 PROCESSAR FOTOS PARA METADATA TAMBÉM
  const fotosOrdenadas = processarFotosCondominio(condominio.Foto, condominio.Codigo);
  
  // Corrigir extração da imagem - buscar foto destacada ou primeira disponível
  const destaqueFotoObj = fotosOrdenadas?.find((f) => f.Destaque === "Sim");
  const primeiraFoto = Array.isArray(fotosOrdenadas) && fotosOrdenadas.length > 0 ? fotosOrdenadas[0] : null;
  
  const destaqueFotoUrl = destaqueFotoObj?.Foto || 
                         destaqueFotoObj?.FotoPequena || 
                         primeiraFoto?.Foto || 
                         primeiraFoto?.FotoPequena ||
                         `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`;
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.npiconsultoria.com.br";
  const currentUrl = `${baseUrl}/${slug}`;
  
  // ✅ Gerar data para o condomínio
  const modifiedDate = new Date().toISOString();

  // 🎯 EXTRAIR ID DO VÍDEO - ADICIONADO
  const videoId = condominio?.Video ? Object.values(condominio.Video)[0]?.Video : null;

  const description = `${rawTitle} em ${condominio.BairroComercial}, ${condominio.Cidade}. ${condominio.Categoria} com ${condominio.MetragemAnt} m2, ${condominio.DormitoriosAntigo} quartos, ${condominio.VagasAntigo} vagas. ${condominio.Situacao}.`;

  return {
    title: `${rawTitle}, ${condominio.TipoEndereco} ${condominio.Endereco} ${condominio.Numero}, ${condominio.BairroComercial}`,
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL),
    robots: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        "pt-BR": currentUrl,
      },
    },
    openGraph: {
      title: rawTitle,
      description,
      url: currentUrl,
      type: "website",
      siteName: "NPI Consultoria",
      publishedTime: modifiedDate,
      modifiedTime: modifiedDate,
      images: [
        {
          url: destaqueFotoUrl,
          width: 1200,
          height: 630,
          alt: rawTitle,
          type: "image/jpeg",
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
      updated_time: modifiedDate,
    },
    twitter: {
      card: videoId ? "player" : "summary_large_image", // 🎯 Muda para player se tiver vídeo
      title: rawTitle,
      description,
      site: "@NPIImoveis",
      creator: "@NPIImoveis",
      images: [
        {
          url: destaqueFotoUrl,
          alt: rawTitle,
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
      'article:published_time': modifiedDate,
      'article:modified_time': modifiedDate,
      'article:author': 'NPI Consultoria',
      'article:section': 'Imobiliário',
      'article:tag': `${condominio.Categoria}, ${condominio.BairroComercial}, ${condominio.Cidade}, condomínio`,
      'og:updated_time': modifiedDate,
      'last-modified': modifiedDate,
      'date': modifiedDate,
      'DC.date.modified': modifiedDate,
      'DC.date.created': modifiedDate,
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
}

export default async function CondominioPage({ params }) {
  const { slug } = params;
  
  // URLs imovel-{id} agora são interceptadas pelo next.config.mjs
  // Esta página só deve processar slugs de condomínios reais
  
  const response = await getCondominioPorSlug(slug);

  if (!response.data) {
    notFound();
  }

  const condominio = response.data;
  const imoveisRelacionados = response.imoveisRelacionados;

  // 🎯 PROCESSAR FOTOS COM photoSorter ANTES DE USAR (igual ao admin que funcionou)
  const fotosOrdenadas = processarFotosCondominio(condominio.Foto, condominio.Codigo);

  // 🎯 DETECTAR ORIENTAÇÃO DA FOTO PRINCIPAL
  const orientacaoFoto = detectarOrientacaoFoto(fotosOrdenadas);
  console.log('📐 ORIENTAÇÃO DA FOTO DETECTADA:', orientacaoFoto);

  // 🎯 NOVA IMPLEMENTAÇÃO: ORDENAR IMÓVEIS RELACIONADOS + LIMPAR METRAGEM
  // Principal primeiro + demais por valor crescente + sem decimais desnecessários
  const imoveisOrdenados = ordenarImoveisRelacionados(imoveisRelacionados, condominio.Codigo);

  const rawTitle = ensureCondominio(condominio.Empreendimento);
  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/${slug}`;
  const modifiedDate = new Date().toISOString();

  // 🎯 EXTRAIR ID DO VÍDEO - ADICIONADO
  const videoId = condominio?.Video ? Object.values(condominio.Video)[0]?.Video : null;

  // 🚀 URL da primeira imagem para preload LCP
  const primeiraImagemUrl = fotosOrdenadas?.[0]?.Foto || fotosOrdenadas?.[0]?.FotoPequena;

  // Structured Data adicional para datas
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

  // 🎯 STRUCTURED DATA DO VÍDEO - ADICIONADO
  let videoStructuredData = null;
  if (videoId) {
    videoStructuredData = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": `Vídeo de apresentação - ${condominio.Empreendimento}`,
      "description": `Conheça o ${condominio.Empreendimento} em ${condominio.BairroComercial}, ${condominio.Cidade}. ${condominio.Categoria} com ${condominio.DormitoriosAntigo} quartos, ${condominio.MetragemAnt} m2, ${condominio.VagasAntigo} vagas.`,
      "thumbnailUrl": `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      "uploadDate": modifiedDate,
      "contentUrl": `https://www.youtube.com/watch?v=${videoId}`,
      "embedUrl": `https://www.youtube.com/embed/${videoId}`,
      "publisher": {
        "@type": "Organization",
        "name": "NPI Consultoria",
        "logo": {
          "@type": "ImageObject",
          "url": `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`
        }
      },
      "potentialAction": {
        "@type": "WatchAction",
        "target": `https://www.youtube.com/watch?v=${videoId}`
      }
    };
  }

  function isValidValue(value) {
    return value !== undefined && value !== null && value !== "" && value !== "0";
  }

  return (
    <>
      {/* 🚀 APENAS PRELOAD DA PRIMEIRA IMAGEM - MÍNIMA ALTERAÇÃO */}
      {primeiraImagemUrl && (
        <link
          rel="preload"
          as="image"
          href={primeiraImagemUrl}
          fetchPriority="high"
        />
      )}

      <section className="w-full bg-zinc-100 pb-10">
        {/* Structured Data para o condomínio */}
        <StructuredDataApartment
          title={rawTitle}
          price={condominio.ValorAntigo ? `R$ ${condominio.ValorAntigo}` : "Consulte"}
          description={`${condominio.Categoria} à venda em ${condominio.BairroComercial}, ${condominio.Cidade}. ${rawTitle}: ${condominio.DormitoriosAntigo} quartos, ${condominio.SuiteAntigo} suítes, ${condominio.BanheiroSocialQtd} banheiros, ${condominio.VagasAntigo} vagas, ${condominio.MetragemAnt} m2. ${condominio.Situacao}. Valor: ${condominio.ValorAntigo ? `R$ ${condominio.ValorAntigo}` : "Consulte"}. ${condominio.TipoEndereco} ${condominio.Endereco}.`}
          address={`${condominio.TipoEndereco} ${condominio.Endereco} ${condominio.Numero}, ${condominio.BairroComercial}, ${condominio.Cidade}`}
          url={currentUrl}
          image={fotosOrdenadas}
        />

        {/* 🎯 STRUCTURED DATA DO VÍDEO - ADICIONADO */}
        {videoStructuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(videoStructuredData),
            }}
          />
        )}

        {/* Structured Data para datas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredDataDates),
          }}
        />

        <ExitIntentModal condominio={rawTitle} link={currentUrl} />

        <div className="container mx-auto pt-20">
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 ">
            <div className="flex flex-col gap-4 ">
              <div className="px-10 py-6 bg-white max-h-[400px] xl:max-h-[300px] rounded-lg flex-grow">
                <div className="flex justify-between">
                  <span className="text-[10px]">Código:{condominio.Codigo}</span>
                  <Share
                    url={currentUrl}
                    title={`Compartilhe o imóvel ${rawTitle} em ${condominio.BairroComercial}`}
                    variant="secondary"
                  />
                </div>

                <h1 className="text-xl font-bold mt-2">{rawTitle}</h1>
                <span className="text-xs text-zinc-700 font-semibold">
                  {condominio.TipoEndereco} {condominio.Endereco} {condominio.Numero}, {condominio.BairroComercial}, {condominio.Cidade}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-4 mb-8">
                  {condominio.ValorAluguelSite && (
                    <div className="flex flex-col rounded-lg bg-zinc-100 p-4">
                      <h2 className="text-zinc-600 text-[10px] font-bold">Aluguel:</h2>
                      <h2 className="text-black font-semibold text-[10px]">R$ {condominio.ValorAluguelSite}</h2>
                    </div>
                  )}

                  <div className="flex flex-col rounded-lg bg-zinc-100 p-4">
                    <h2 className="text-zinc-600 text-[10px] font-bold">Preço:</h2>
                    <h2 className="text-black font-semibold text-[10px]">R$ {condominio.ValorAntigo}</h2>
                  </div>

                  {condominio.ValorCondominio && (
                    <div className="flex flex-col rounded-lg bg-zinc-100 p-4">
                      <h4 className="text-zinc-600 text-[10px] font-bold">Condomínio:</h4>
                      <h2 className="text-black font-semibold text-[10px]">{formatterValue(condominio.ValorCondominio)}</h2>
                    </div>
                  )}
                  {condominio.ValorIptu && (
                    <div className="flex flex-col rounded-lg bg-zinc-100 p-4">
                      <h4 className="text-zinc-600 text-[10px] font-bold">IPTU:</h4>
                      <h2 className="text-black font-semibold text-[10px]">{formatterValue(condominio.ValorIptu)}</h2>
                    </div>
                  )}
                </div>
                <ScrollToImoveisButton text={`Mostrar imóveis (${imoveisOrdenados.length})`} />
              </div>
              <div className="relative w-full h-[230px] overflow-y-auto bg-white rounded-lg overflow-hidden p-4">
                {isValidValue(condominio.ValorVenda2) || isValidValue(condominio.ValorGarden) || isValidValue(condominio.ValorCobertura) ? (
                  <PropertyTableOwner imovel={condominio} />
                ) : (
                  <PropertyTable imoveisRelacionados={imoveisOrdenados} />
                )}
              </div>
            </div>
            <div className={`relative w-full overflow-hidden rounded-lg ${
              orientacaoFoto === 'vertical' 
                ? 'h-[550px]' // ✅ Altura fixa para vertical
                : 'min-h-[550px]' // ✅ Altura mínima para horizontal
            }`}>
              <ImageGallery 
                fotos={fotosOrdenadas}
                title={rawTitle}
                shareUrl={currentUrl}
                shareTitle={`Compartilhe o imóvel ${rawTitle} em ${condominio.BairroComercial}`}
                layout="single"
                priority={true}
                fetchPriority="high"
                className={orientacaoFoto === 'vertical' ? 'h-full w-full object-cover object-center' : ''}
              />
            </div>
          </div>
        </div>

        {/* TUDO IGUAL À VERSÃO ORIGINAL - SEM LAZY LOADING */}
        {imoveisOrdenados && imoveisOrdenados.length > 0 && (
          <div id="imoveis-relacionados">
            <ImoveisRelacionados imoveisRelacionados={imoveisOrdenados} />
          </div>
        )}
        
        <SobreCondominio condominio={condominio} />

        {condominio.FichaTecnica && <FichaTecnica condominio={condominio} />}
        {condominio.DestaquesDiferenciais && <DetalhesCondominio imovel={condominio} />}
        {condominio.DestaquesLazer && <Lazer condominio={condominio} />}
        {condominio.Video && Object.keys(condominio.Video).length > 0 && (
        <VideoCondominio imovel={condominio} />
        )}
        {condominio.Tour360 && (
          <TourVirtual link={condominio.Tour360} titulo={rawTitle} />
        )}

        <ExploreRegiao condominio={condominio} currentUrl={currentUrl} />
        <WhatsappFloat
          message={`Quero saber mais sobre o ${rawTitle}, no bairro ${condominio.BairroComercial}, disponível na página de Condomínio: ${currentUrl}`}
        />
      </section>
    </>
  );
}
