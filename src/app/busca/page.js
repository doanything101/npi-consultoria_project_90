// src/app/busca/page.js - CORRIGIDO: cards usam a mesma finalidade do mapa ("locacao"/"venda")

"use client";

import { useEffect, useState } from "react";
import CardImovel, { CardImovelSkeleton } from "../components/ui/card-imovel";
import Pagination from "../components/ui/pagination";
import dynamic from "next/dynamic";

// Import map component dynamically to avoid SSR issues
const MapComplete = dynamic(() => import("./components/map-complete"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        <p className="mt-2 text-gray-700">Carregando mapa...</p>
      </div>
    </div>
  ),
});
import { Footer } from "../components/ui/footer";

import {
  AdjustmentsHorizontalIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import PropertyFilters from "./components/property-filters";
import { getImoveis, searchImoveis } from "../services";
import useFiltersStore from "../store/filtrosStore";
import useFavoritosStore from "../store/favoritosStore";
import useImovelStore from "../store/imovelStore";
import { gerarTituloSeoFriendly, gerarDescricaoSeoFriendly, gerarUrlSeoFriendly } from "../utils/url-slugs";
import { useRouter } from "next/navigation";

/* =========================
   Helpers de finalidade (igual ao mapa)
========================= */
const normalize = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const finalidadeToApi = (finalidadeUI) => {
  const f = normalize(finalidadeUI);
  if (["alugar", "aluguel", "locacao", "locação", "locar", "rent"].includes(f)) return "locacao";
  if (["comprar", "venda", "buy", "sell", "compra"].includes(f)) return "venda";
  return ""; // sem filtro
};

export default function BuscaImoveis() {
  const [imoveis, setImoveis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const filtrosAtuais = useFiltersStore((state) => state);
  const filtrosAplicados = useFiltersStore((state) => state.filtrosAplicados);
  const filtrosBasicosPreenchidos = useFiltersStore((state) => state.filtrosBasicosPreenchidos);

  const [searchTerm, setSearchTerm] = useState("");
  const [ordenacao, setOrdenacao] = useState("relevancia");

  const adicionarVariosImoveisCache = useImovelStore((state) => state.adicionarVariosImoveisCache);

  const router = useRouter();

  const [mostrandoFavoritos, setMostrandoFavoritos] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);

  const { favoritos, getQuantidadeFavoritos } = useFavoritosStore();
  const quantidadeFavoritos = getQuantidadeFavoritos();

  const atualizacoesFiltros = useFiltersStore((state) => state.atualizacoesFiltros);

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 12,
  });

  const [filtroVisivel, setFiltroVisivel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [fullyInitialized, setFullyInitialized] = useState(false);
  const [uiVisible, setUiVisible] = useState(false);

  // 🔥 CONTROLE DE INICIALIZAÇÃO SIMPLIFICADO
  const [initialLoad, setInitialLoad] = useState(true);

  // 🎯 FUNÇÃO PARA ATUALIZAR STRUCTURED DATA DINAMICAMENTE
  const updateStructuredData = (totalItems = 0, imoveisData = []) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://npiconsultoria.com.br';
      const currentDate = new Date().toISOString();
      
      // Buscar script existente ou criar novo
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      
      const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SearchResultsPage",
            "@id": `${baseUrl}/busca#webpage`,
            url: window?.location?.href || `${baseUrl}/busca`,
            name: document.title,
            description: document.querySelector('meta[name="description"]')?.content || '',
            datePublished: currentDate,
            dateModified: currentDate,
            isPartOf: {
              "@type": "WebSite",
              "@id": `${baseUrl}#website`,
              name: "NPi Imóveis",
              url: baseUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${baseUrl}/busca?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: totalItems,
              itemListElement: imoveisData.slice(0, 10).map((imovel, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "RealEstateAgent",
                  name: imovel.NomeImovel || `Imóvel ${imovel.Codigo}`,
                  url: `${baseUrl}/imovel/${imovel.Codigo}`,
                  image: imovel.Foto1 || `${baseUrl}/assets/default-property.jpg`,
                  description: imovel.Observacoes?.substring(0, 200) || `Imóvel código ${imovel.Codigo}`,
                  offers: {
                    "@type": "Offer",
                    price: imovel.ValorNumerico || 0,
                    priceCurrency: "BRL",
                    availability: "https://schema.org/InStock"
                  },
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: imovel.Cidade || "São Paulo",
                    addressRegion: "SP",
                    addressCountry: "BR"
                  }
                }
              }))
            }
          },
          {
            "@type": "Organization",
            "@id": `${baseUrl}#organization`,
            name: "NPi Imóveis",
            url: baseUrl,
            logo: {
              "@type": "ImageObject",
              url: `${baseUrl}/assets/images/logo-npi.png`,
              width: 300,
              height: 100
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+55-11-99999-9999",
              contactType: "customer service",
              areaServed: "BR",
              availableLanguage: "Portuguese"
            },
            sameAs: [
              "https://www.instagram.com/npiimoveis",
              "https://www.linkedin.com/company/npi-imoveis",
              "https://www.facebook.com/npiimoveis"
            ]
          }
        ]
      };
      
      script.textContent = JSON.stringify(structuredData);
      console.log('✅ Structured Data atualizado:', { totalItems, imoveisCount: imoveisData.length });
    } catch (error) {
      console.error('❌ Erro ao atualizar Structured Data:', error);
    }
  };

  // 🔥 FUNÇÃO PARA ATUALIZAR META TAGS DINAMICAMENTE BASEADO NOS FILTROS ATUAIS
  const updateClientMetaTags = (quantidadeResultados = null) => {
    if (typeof window === 'undefined') return;
    try {
      const currentDate = new Date().toISOString();
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://npiconsultoria.com.br';
      
      // 🎯 OBTER FILTROS ATUAIS DO STORE
      const filtrosAtuais = useFiltersStore.getState();
      
      console.log('🎯 [META-TAGS] Filtros atuais completos:', filtrosAtuais);
      console.log('🎯 [META-TAGS] Finalidade detectada:', filtrosAtuais.finalidade);
      
      let title = 'NPi Consultoria - Imóveis de Alto Padrão'; // Título padrão
      let description = 'Especialistas em imóveis de alto padrão. Encontre apartamentos, casas e terrenos exclusivos com a melhor consultoria imobiliária.';
      let keywords = 'busca imóveis, apartamentos luxo, casas alto padrão, imóveis São Paulo, NPi Imóveis';
      let canonicalUrl = `${baseUrl}/busca`;

      // 🔥 GERAR TÍTULO DINÂMICO BASEADO NOS FILTROS APLICADOS
      if (filtrosAtuais.cidadeSelecionada || filtrosAtuais.categoriaSelecionada || filtrosAtuais.finalidade) {
        const titleParts = [];
        const descriptionParts = [];
        
        // 1. Categoria (plural para título, normal para descrição)
        let categoriaPlural = 'Imóveis';
        if (filtrosAtuais.categoriaSelecionada) {
          const categoriaPluralMap = {
            'Apartamento': 'Apartamentos',
            'Casa': 'Casas',
            'Casa Comercial': 'Casas comerciais',
            'Casa em Condominio': 'Casas em condomínio',
            'Cobertura': 'Coberturas',
            'Flat': 'Flats',
            'Garden': 'Gardens',
            'Loft': 'Lofts',
            'Loja': 'Lojas',
            'Prédio Comercial': 'Prédios comerciais',
            'Sala Comercial': 'Salas comerciais',
            'Sobrado': 'Sobrados',
            'Terreno': 'Terrenos'
          };
          categoriaPlural = categoriaPluralMap[filtrosAtuais.categoriaSelecionada] || 'Imóveis';
          titleParts.push(categoriaPlural);
          descriptionParts.push(categoriaPlural.toLowerCase());
        } else {
          titleParts.push('Imóveis');
          descriptionParts.push('imóveis');
        }
        
        // 2. Finalidade
        let finalidadeTexto = '';
        if (filtrosAtuais.finalidade === 'Comprar') {
          finalidadeTexto = 'a venda';
        } else if (filtrosAtuais.finalidade === 'Alugar') {
          finalidadeTexto = 'para aluguel';
        }
        
        if (finalidadeTexto) {
          titleParts.push(finalidadeTexto);
          descriptionParts.push(finalidadeTexto);
        }
        
        // 3. Localização
        if (filtrosAtuais.cidadeSelecionada) {
          const cidadeFormatada = filtrosAtuais.cidadeSelecionada
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          titleParts.push(`no ${cidadeFormatada}`);
          descriptionParts.push(cidadeFormatada);
        }
        
        // 4. Bairros específicos (só na descrição)
        if (filtrosAtuais.bairrosSelecionados && filtrosAtuais.bairrosSelecionados.length > 0) {
          if (filtrosAtuais.bairrosSelecionados.length === 1) {
            descriptionParts.push(`- ${filtrosAtuais.bairrosSelecionados[0]}`);
          } else if (filtrosAtuais.bairrosSelecionados.length <= 2) {
            descriptionParts.push(`- ${filtrosAtuais.bairrosSelecionados.join(', ')}`);
          }
        }
        
        // 🎯 CONSTRUIR TÍTULO NO NOVO FORMATO
        const quantidadeAtual = quantidadeResultados !== null ? quantidadeResultados : (pagination?.totalItems || 0);
        if (quantidadeAtual > 0) {
          title = `${titleParts.join(' ')} ${quantidadeAtual} imóveis`;
        } else {
          title = `${titleParts.join(' ')}`;
        }
        
        description = `Especialistas em ${descriptionParts.join(' ')}. NPi`;
        
        // 🎯 CONSTRUIR URL CANÔNICA
        const urlAtual = window?.location?.pathname || '';
        if (urlAtual.startsWith('/buscar/') && urlAtual.split('/').length >= 5) {
          canonicalUrl = (window?.location?.origin || baseUrl) + urlAtual;
        } else if (filtrosAtuais.cidadeSelecionada && filtrosAtuais.categoriaSelecionada && filtrosAtuais.finalidade) {
          // Gerar URL SEO-friendly
          let finalidadeSlug = 'venda';
          if (filtrosAtuais.finalidade === 'Comprar' || filtrosAtuais.finalidade === 'venda') {
            finalidadeSlug = 'venda';
          } else if (filtrosAtuais.finalidade === 'Alugar' || filtrosAtuais.finalidade === 'aluguel') {
            finalidadeSlug = 'aluguel';
          }
          
          const categoriaSlugMap = {
            'Apartamento': 'apartamentos',
            'Casa': 'casas',
            'Cobertura': 'coberturas',
            'Terreno': 'terrenos',
            'Flat': 'flats',
            'Garden': 'gardens',
            'Loft': 'lofts',
            'Loja': 'lojas',
            'Sobrado': 'sobrados'
          };
          const categoriaSlug = categoriaSlugMap[filtrosAtuais.categoriaSelecionada] || filtrosAtuais.categoriaSelecionada.toLowerCase();
          const cidadeSlug = filtrosAtuais.cidadeSelecionada.toLowerCase().replace(/\s+/g, '-');
          
          canonicalUrl = `${baseUrl}/buscar/${finalidadeSlug}/${categoriaSlug}/${cidadeSlug}`;
        } else {
          canonicalUrl = (window?.location?.origin || baseUrl) + (window?.location?.pathname || '') + (window?.location?.search || '');
        }
      }

      // 🔥 FORÇAR ATUALIZAÇÃO DO TÍTULO
      document.title = title;
      
      const existingTitleMeta = document.querySelector('meta[name="title"]');
      if (existingTitleMeta) existingTitleMeta.remove();
      const titleMeta = document.createElement('meta');
      titleMeta.setAttribute('name', 'title');
      titleMeta.setAttribute('content', title);
      document.head.appendChild(titleMeta);
      
      const metaTags = [
        { name: 'description', content: description },
        { name: 'keywords', content: keywords },
        { name: 'date', content: currentDate },
        { name: 'last-modified', content: currentDate },
        { name: 'datePublished', content: currentDate },
        { name: 'dateModified', content: currentDate },
        { property: 'article:published_time', content: currentDate },
        { property: 'article:modified_time', content: currentDate },
        { property: 'og:updated_time', content: currentDate },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'NPi Imóveis' },
        { property: 'og:locale', content: 'pt_BR' },
        { property: 'og:image', content: `${baseUrl}/assets/busca-imoveis.jpg` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: title },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@NPIImoveis' },
        { name: 'twitter:creator', content: '@NPIImoveis' },
        { name: 'twitter:image', content: `${baseUrl}/assets/busca-imoveis.jpg` },
        { name: 'twitter:image:alt', content: title },
        { name: 'DC.date.created', content: currentDate },
        { name: 'DC.date.modified', content: currentDate },
        { name: 'x-robots-tag', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      ];
      
      metaTags.forEach(tag => {
        const selector = tag.name ? `meta[name="${tag.name}"]` : `meta[property="${tag.property}"]`;
        let existingTag = document.querySelector(selector);
        if (!existingTag) {
          existingTag = document.createElement('meta');
          if (tag.name) existingTag.setAttribute('name', tag.name);
          if (tag.property) existingTag.setAttribute('property', tag.property);
          document.head.appendChild(existingTag);
        }
        existingTag.setAttribute('content', tag.content);
      });
      
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);
      
      let hreflangPtBr = document.querySelector('link[rel="alternate"][hreflang="pt-BR"]');
      if (!hreflangPtBr) {
        hreflangPtBr = document.createElement('link');
        hreflangPtBr.setAttribute('rel', 'alternate');
        hreflangPtBr.setAttribute('hreflang', 'pt-BR');
        document.head.appendChild(hreflangPtBr);
      }
      hreflangPtBr.setAttribute('href', canonicalUrl);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar meta tags:', error);
    }
  };

  // 🔥 FUNÇÃO PARA NORMALIZAR NOME DE CIDADE
  const normalizarCidade = (cidade) => {
    if (!cidade) return null;
    const cidadesMapeadas = {
      'guaruja': 'Guarujá',
      'guarujá': 'Guarujá',
      'Guaruja': 'Guarujá',
      'GUARUJA': 'Guarujá',
      'sao-paulo': 'São Paulo',
      'sao_paulo': 'São Paulo',
      'santo-andre': 'Santo André',
      'santos': 'Santos',
      'praia-grande': 'Praia Grande',
      'bertioga': 'Bertioga',
      'mongagua': 'Mongaguá',
      'mongaguá': 'Mongaguá',
      'ubatuba': 'Ubatuba',
      'caraguatatuba': 'Caraguatatuba',
      'sao-sebastiao': 'São Sebastião',
      'ilhabela': 'Ilhabela'
    };
    const cidadeNormalizada = cidadesMapeadas[cidade.toLowerCase()];
    if (cidadeNormalizada) return cidadeNormalizada;
    return cidade.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim();
  };

  // 🔥 FUNÇÃO CORRIGIDA PARA EXTRAIR PARÂMETROS DE URL SEO-FRIENDLY
  const extractFromSeoUrl = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const seoUrlMatch = path.match(/\/buscar?\/([^\/]+)\/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/);
    if (seoUrlMatch) {
      const [, finalidade, categoria, cidade, bairro] = seoUrlMatch;

      let finalidadeStore = 'Comprar';
      if (finalidade === 'venda' || finalidade === 'comprar' || finalidade === 'compra') {
        finalidadeStore = 'Comprar';
      } else if (finalidade === 'aluguel' || finalidade === 'alugar' || finalidade === 'locacao') {
        finalidadeStore = 'Alugar';
      }
      const categoriaSingularMap = {
        'apartamentos': 'Apartamento',
        'casas': 'Casa',
        'coberturas': 'Cobertura',
        'terrenos': 'Terreno',
        'flats': 'Flat',
        'gardens': 'Garden',
        'lofts': 'Loft',
        'lojas': 'Loja',
        'sobrados': 'Sobrado',
        'apartamento': 'Apartamento',
        'casa': 'Casa',
        'cobertura': 'Cobertura',
        'terreno': 'Terreno'
      };
      const categoriaStore = categoriaSingularMap[categoria.toLowerCase()] || 
        categoria.charAt(0).toUpperCase() + categoria.slice(1);
      const cidadeStore = normalizarCidade(cidade);

      return {
        finalidade: finalidadeStore,
        categoria: categoriaStore,
        cidade: cidadeStore,
        bairro: bairro ? normalizarCidade(bairro) : null
      };
    }
    return null;
  };

  // 🔥 FUNÇÃO CORRIGIDA PARA ATUALIZAR URL (PRESERVAR HISTÓRICO)
  const updateUrlFromFilters = () => {
    const filtrosAtuais = useFiltersStore.getState();
    if (filtrosAtuais.cidadeSelecionada && filtrosAtuais.finalidade && filtrosAtuais.categoriaSelecionada) {
      const urlAmigavel = gerarUrlSeoFriendly(filtrosAtuais);
      router.replace(urlAmigavel);
    } else {
      const params = new URLSearchParams();
      if (filtrosAtuais.cidadeSelecionada) params.set('cidade', filtrosAtuais.cidadeSelecionada);
      if (filtrosAtuais.finalidade) params.set('finalidade', filtrosAtuais.finalidade);
      if (filtrosAtuais.categoriaSelecionada) params.set('categoria', filtrosAtuais.categoriaSelecionada);
      if (filtrosAtuais.bairrosSelecionados && filtrosAtuais.bairrosSelecionados.length > 0) {
        params.set('bairros', filtrosAtuais.bairrosSelecionados.join(','));
      }
      if (filtrosAtuais.quartos) params.set('quartos', filtrosAtuais.quartos);
      if (filtrosAtuais.precoMin) params.set('precoMin', filtrosAtuais.precoMin);
      if (filtrosAtuais.precoMax) params.set('precoMax', filtrosAtuais.precoMax);
      const urlComParams = params.toString() ? `/busca?${params.toString()}` : '/busca';
      router.replace(urlComParams);
    }
  };

  // 🔥 FUNÇÃO SIMPLIFICADA PARA BUSCAR IMÓVEIS (cards) — agora com finalidade da API
  const buscarImoveis = async (comFiltros = false) => {
    if (mostrandoFavoritos) return;

    setIsLoading(true);
    try {
      let params = {};

      if (comFiltros) {
        const filtrosAtuais = useFiltersStore.getState();
        const finalidadeApi = finalidadeToApi(filtrosAtuais.finalidade);

        params = {
          categoria: filtrosAtuais.categoriaSelecionada || undefined,
          cidade: filtrosAtuais.cidadeSelecionada || undefined,
          quartos: filtrosAtuais.quartos || undefined,
          banheiros: filtrosAtuais.banheiros || undefined,
          vagas: filtrosAtuais.vagas || undefined,
        };

        if (finalidadeApi) params.finalidade = finalidadeApi;

        if (filtrosAtuais.bairrosSelecionados && filtrosAtuais.bairrosSelecionados.length > 0) {
          params.bairrosArray = filtrosAtuais.bairrosSelecionados;
        }

        // preços — enviar sempre precoMinimo/Maximo; se locação, duplicar
        if (filtrosAtuais.precoMin != null) {
          params.precoMinimo = filtrosAtuais.precoMin;
          if (finalidadeApi === "locacao") params.precoAluguelMin = filtrosAtuais.precoMin;
        }
        if (filtrosAtuais.precoMax != null) {
          params.precoMaximo = filtrosAtuais.precoMax;
          if (finalidadeApi === "locacao") params.precoAluguelMax = filtrosAtuais.precoMax;
        }

        if (filtrosAtuais.areaMin && filtrosAtuais.areaMin !== "0") {
          params.areaMinima = filtrosAtuais.areaMin;
        }
        if (filtrosAtuais.areaMax && filtrosAtuais.areaMax !== "0") {
          params.areaMaxima = filtrosAtuais.areaMax;
        }
        if (filtrosAtuais.abaixoMercado) params.apenasCondominios = true;
        if (filtrosAtuais.proximoMetro) params.proximoMetro = true;

        console.log('🔍 [BUSCAR] Params finais para API (cards):', params);
      }

      const response = await getImoveis(params, currentPage, 12);

      if (response && response.imoveis) {
        setImoveis(response.imoveis);
        if (Array.isArray(response.imoveis) && response.imoveis.length > 0) {
          adicionarVariosImoveisCache(response.imoveis);
        }
      } else {
        setImoveis([]);
      }

      if (response && response.pagination) {
        const validPagination = {
          totalItems: Number(response.pagination.totalItems) || 0,
          totalPages: Number(response.pagination.totalPages) || 1,
          currentPage: Number(response.pagination.currentPage) || 1,
          itemsPerPage: Number(response.pagination.itemsPerPage) || 12,
          limit: Number(response.pagination.itemsPerPage) || 12,
        };
        setPagination(validPagination);
        updateStructuredData(validPagination.totalItems, response.imoveis || []);
        setTimeout(() => updateClientMetaTags(validPagination.totalItems), 100);
      }
    } catch (error) {
      console.error("❌ [BUSCAR] Erro ao buscar imóveis:", error);
      setImoveis([]);
      setPagination({
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 12,
        limit: 12,
      });
      updateStructuredData(0, []);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 EFEITO PRINCIPAL INICIAL: PROCESSAR URL E BUSCAR
  useEffect(() => {
    if (!initialLoad) return;
    setIsBrowser(true);
    
    const seoParams = extractFromSeoUrl();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const cidade = searchParams.get('cidade');
    const finalidade = searchParams.get('finalidade');
    const categoria = searchParams.get('categoria');
    const bairros = searchParams.get('bairros');
    const quartos = searchParams.get('quartos');
    const precoMin = searchParams.get('precoMin');
    const precoMax = searchParams.get('precoMax');
    const searchQuery = searchParams.get('q');

    if (seoParams || cidade || finalidade || categoria || bairros || quartos || precoMin || precoMax) {
      const filtrosParaAplicar = {};
      if (seoParams) {
        filtrosParaAplicar.cidadeSelecionada = seoParams.cidade;
        filtrosParaAplicar.finalidade = seoParams.finalidade;
        filtrosParaAplicar.categoriaSelecionada = seoParams.categoria;
        if (seoParams.bairro) filtrosParaAplicar.bairrosSelecionados = [seoParams.bairro];
      } else {
        if (cidade) filtrosParaAplicar.cidadeSelecionada = normalizarCidade(cidade);
        if (finalidade) filtrosParaAplicar.finalidade = finalidade;
        if (categoria) filtrosParaAplicar.categoriaSelecionada = categoria;
        if (bairros) {
          const bairrosArray = bairros.split(',').map(b => b.trim()).filter(b => b.length > 0);
          filtrosParaAplicar.bairrosSelecionados = bairrosArray;
        }
      }
      if (quartos) filtrosParaAplicar.quartos = parseInt(quartos);
      if (precoMin) filtrosParaAplicar.precoMin = parseFloat(precoMin);
      if (precoMax) filtrosParaAplicar.precoMax = parseFloat(precoMax);

      const filtrosStore = useFiltersStore.getState();
      filtrosStore.limparFiltros();

      setTimeout(() => {
        filtrosStore.setFilters(filtrosParaAplicar);
        filtrosStore.aplicarFiltros();
        setTimeout(() => {
          const storeDepois = useFiltersStore.getState();
          const event = new CustomEvent('filtrosUpdated', { detail: storeDepois });
          if (typeof window !== 'undefined') window.dispatchEvent(event);
        }, 50);
      }, 50);

      setTimeout(() => {
        buscarImoveis(true);
        setInitialLoad(false);
      }, 200);
    } else {
      if (searchQuery) {
        setSearchTerm(searchQuery);
        setTimeout(() => {
          handleSearch(searchQuery);
          setInitialLoad(false);
        }, 100);
      } else {
        setTimeout(() => {
          buscarImoveis(false);
          setInitialLoad(false);
        }, 100);
      }
    }

    setTimeout(() => {
      updateClientMetaTags();
    }, 300);
    
  }, [initialLoad]);

  // 🔥 EFEITO PARA BUSCA QUANDO FILTROS SÃO APLICADOS MANUALMENTE (APÓS INICIALIZAÇÃO)
  useEffect(() => {
    if (initialLoad || !filtrosAplicados) return;
    buscarImoveis(true);
  }, [filtrosAplicados, atualizacoesFiltros, initialLoad]);

  // 🔥 EFEITO PARA FAVORITOS
  useEffect(() => {
    if (initialLoad) return;
    if (mostrandoFavoritos) {
      setImoveis(favoritos);
      setPagination({
        totalItems: favoritos.length,
        totalPages: Math.ceil(favoritos.length / 12),
        currentPage: 1,
        itemsPerPage: 12,
        limit: 12,
      });
      setIsLoading(false);
      updateStructuredData(favoritos.length, favoritos);
      setTimeout(() => updateClientMetaTags(favoritos.length), 100);
    }
  }, [mostrandoFavoritos, favoritos, initialLoad]);

  // 🔥 EFEITO PARA PAGINAÇÃO
  useEffect(() => {
    if (initialLoad || currentPage === 1) return;
    if (mostrandoFavoritos) {
      // nada
    } else if (filtrosAplicados) {
      buscarImoveis(true);
    } else {
      buscarImoveis(false);
    }
  }, [currentPage, initialLoad]);

  // 🔥 EFEITO PARA ATUALIZAR URL QUANDO FILTROS MUDAM (APLICAÇÃO MANUAL)
  useEffect(() => {
    if (!isBrowser || initialLoad) return;
    const filtrosAtuais = useFiltersStore.getState();
    if (filtrosAtuais.filtrosAplicados) {
      setTimeout(() => {
        updateUrlFromFilters();
      }, 100);
    }
  }, [atualizacoesFiltros, isBrowser, initialLoad]);

  // 🔥 EFEITO PARA ATUALIZAR META TAGS QUANDO DADOS CARREGAM
  useEffect(() => {
    if (isBrowser && !isLoading && pagination.totalItems >= 0) {
      setTimeout(() => {
        updateClientMetaTags(pagination.totalItems);
      }, 100);
    }
  }, [isBrowser, isLoading, pagination.totalItems]);

  // Detectar ambiente de cliente e tamanho da tela
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (fullyInitialized) {
      const timer = setTimeout(() => {
        setUiVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fullyInitialized]);

  useEffect(() => {
    if (!isClient) return;
    setFiltroVisivel(!isMobile);
  }, [isClient, isMobile]);

  useEffect(() => {
    if (!isClient) return;
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
      setFullyInitialized(true);
    };
    checkScreenSize();
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
    }
  }, [isClient]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleFavoritos = () => {
    const novoEstado = !mostrandoFavoritos;
    setMostrandoFavoritos(novoEstado);
    setCurrentPage(1);

    if (novoEstado) {
      setImoveis(favoritos);
      const paginationData = {
        totalItems: favoritos.length,
        totalPages: Math.ceil(favoritos.length / 12),
        currentPage: 1,
        itemsPerPage: 12,
        limit: 12,
      };
      setPagination(paginationData);
      updateStructuredData(favoritos.length, favoritos);
      setTimeout(() => updateClientMetaTags(favoritos.length), 100);
    } else {
      buscarImoveis(filtrosAplicados);
    }
  };

  const handleSearch = async (term) => {
    useFiltersStore.getState().limparFiltros();

    if (!term || term.trim() === "") {
      buscarImoveis(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await searchImoveis(term);
      if (response && response.data) {
        setImoveis(response.data);
        const paginationData = {
          totalItems: response.data.length,
          totalPages: Math.ceil(response.data.length / 12),
          currentPage: 1,
          itemsPerPage: 12,
          limit: 12,
        };
        setPagination(paginationData);

        if (Array.isArray(response.data) && response.data.length > 0) {
          adicionarVariosImoveisCache(response.data);
        }
        updateStructuredData(response.data.length, response.data);
        setTimeout(() => updateClientMetaTags(response.data.length), 100);
      } else {
        setImoveis([]);
        updateStructuredData(0, []);
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      setImoveis([]);
      updateStructuredData(0, []);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFiltro = () => {
    setFiltroVisivel(!filtroVisivel);
  };

  const renderCards = () => {
    if (isLoading) {
      return Array(12)
        .fill(null)
        .map((_, index) => (
          <div key={`skeleton-${index}`} className="w-full sm:w-1/2 xl:w-[32%] min-w-0 flex-shrink-0">
            <CardImovelSkeleton />
          </div>
        ));
    }

    if (Array.isArray(imoveis) && imoveis.length > 0) {
      let imoveisOrdenados = [...imoveis];

      if (ordenacao === "maior_valor") {
        imoveisOrdenados.sort((a, b) => {
          const valorA = a.ValorAntigo ? parseFloat(a.ValorAntigo.replace(/\D/g, "")) : 0;
          const valorB = b.ValorAntigo ? parseFloat(b.ValorAntigo.replace(/\D/g, "")) : 0;
          return valorB - valorA;
        });
      } else if (ordenacao === "menor_valor") {
        imoveisOrdenados.sort((a, b) => {
          const valorA = a.ValorAntigo ? parseFloat(a.ValorAntigo.replace(/\D/g, "")) : 0;
          const valorB = b.ValorAntigo ? parseFloat(b.ValorAntigo.replace(/\D/g, "")) : 0;
          return valorA - valorB;
        });
      }

      return imoveisOrdenados.map((imovel) => {
        const key =
          imovel.Codigo || `imovel-${imovel._id || Math.random().toString(36).substr(2, 9)}`;
        return (
          <div key={key} className="w-full sm:w-1/2 xl:w-[32%] min-w-0 flex-shrink-0">
            <CardImovel {...imovel} target="_blank" />
          </div>
        );
      });
    }

    return <p className="text-center w-full py-8">Nenhum imóvel encontrado.</p>;
  };

  const construirTextoFiltros = () => {
    const filtrosAtuais = useFiltersStore.getState();
    let texto = '';
    const quantidade = pagination.totalItems || 0;
    texto += `${quantidade}`;
    if (filtrosAtuais.categoriaSelecionada) {
      const categoriaPluralMap = {
        'Apartamento': 'apartamentos',
        'Casa': 'casas',
        'Casa Comercial': 'casas comerciais',
        'Casa em Condominio': 'casas em condomínio',
        'Cobertura': 'coberturas',
        'Flat': 'flats',
        'Garden': 'gardens',
        'Loft': 'lofts',
        'Loja': 'lojas',
        'Prédio Comercial': 'prédios comerciais',
        'Sala Comercial': 'salas comerciais',
        'Sobrado': 'sobrados',
        'Terreno': 'terrenos'
      };
      const categoriaPlural = categoriaPluralMap[filtrosAtuais.categoriaSelecionada] || 'imóveis';
      texto += ` ${categoriaPlural}`;
    } else {
      texto += ' imóveis';
    }
    if (filtrosAtuais.finalidade) {
      const finalidadeTexto =
        filtrosAtuais.finalidade === 'Comprar' ? 'a venda'
        : filtrosAtuais.finalidade === 'Alugar' ? 'para aluguel'
        : '';
      if (finalidadeTexto) texto += ` ${finalidadeTexto}`;
    }
    if (filtrosAtuais.bairrosSelecionados && filtrosAtuais.bairrosSelecionados.length > 0) {
      if (filtrosAtuais.bairrosSelecionados.length === 1) {
        texto += ` em ${filtrosAtuais.bairrosSelecionados[0]}`;
      } else if (filtrosAtuais.bairrosSelecionados.length <= 3) {
        texto += ` em ${filtrosAtuais.bairrosSelecionados.join(', ')}`;
      } else {
        texto += ` em ${filtrosAtuais.bairrosSelecionados.slice(0, 2).join(', ')} e mais ${filtrosAtuais.bairrosSelecionados.length - 2} bairros`;
      }
    } else if (filtrosAtuais.cidadeSelecionada) {
      const cidadeFormatada = filtrosAtuais.cidadeSelecionada
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      texto += ` em ${cidadeFormatada}`;
    }
    return texto || 'Busca de imóveis';
  };

  const handleOrdenacaoChange = (e) => {
    setOrdenacao(e.target.value);
  };

  const resetarEstadoBusca = () => {
    setSearchTerm("");
    setCurrentPage(1);
    if (mostrandoFavoritos) setMostrandoFavoritos(false);
  };

  return (
    <>
      {/* Filtros horizontais */}
      <div className="fixed top-20 left-0 w-full bg-white z-40 shadow-sm border-b px-4 md:px-10">
        <PropertyFilters
          horizontal={true}
          onFilter={resetarEstadoBusca}
          isVisible={filtroVisivel}
          setIsVisible={setFiltroVisivel}
        />
      </div>

      {/* Layout 50/50 simétrico - Cards + Mapa ocupando toda viewport */}
      <div className="fixed top-28 left-0 w-full h-[calc(100vh-7rem)] flex overflow-hidden bg-zinc-100">
        {/* Área dos Cards - 50% */}
        <div className="w-1/2 flex flex-col overflow-hidden">
            {/* Header dos cards */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0 p-4 border-b border-gray-200 bg-white">
              <h2 className="text-xs font-bold text-zinc-500">{construirTextoFiltros()}</h2>
              <select
                className="text-xs font-bold text-zinc-500 bg-zinc-100 p-2 rounded-md w-full sm:w-auto"
                value={ordenacao}
                onChange={handleOrdenacaoChange}
              >
                <option value="relevancia">Mais relevantes</option>
                <option value="maior_valor">Maior Valor</option>
                <option value="menor_valor">Menor Valor</option>
              </select>
            </div>

            {/* Área rolável dos cards */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-wrap gap-3">{renderCards()}</div>
              
              {/* Paginação */}
              <div className="mt-6 mb-6">
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
              </div>

              {/* Footer no final da rolagem dos cards */}
              <div className="mt-12">
                <Footer />
              </div>
            </div>
          </div>

        {/* Área do Mapa - 50% */}
        <div className="w-1/2 relative h-full">
          <div className="absolute inset-0 right-0 h-full overflow-hidden">
            <MapComplete filtros={filtrosAtuais} />
          </div>
        </div>
      </div>
    </>
  );
}
