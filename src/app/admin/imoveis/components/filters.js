import { getBairrosPorCidade, getImoveisByFilters } from "@/app/services";
import { useEffect, useState, useRef } from "react";

export default function FiltersImoveisAdmin({ onFilter }) {
  // Refs para os dropdowns
  const bairrosRef = useRef(null);
  const situacaoRef = useRef(null);

  // Estados principais
  const [categorias, setCategorias] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [bairrosReais, setBairrosReais] = useState([]);
  const [situacoesReais, setSituacoesReais] = useState([]);

  // Estados de seleção
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [cidadeSelecionada, setCidadeSelecionada] = useState("");
  const [bairrosSelecionados, setBairrosSelecionados] = useState([]);
  const [situacoesSelecionadas, setSituacoesSelecionadas] = useState([]);
  const [valorMin, setValorMin] = useState(null);
  const [valorMax, setValorMax] = useState(null);
  const [areaMin, setAreaMin] = useState(null);
  const [areaMax, setAreaMax] = useState(null);

  // Estados de UI
  const [bairroFilter, setBairroFilter] = useState("");
  const [situacaoFilter, setSituacaoFilter] = useState("");
  const [bairrosExpanded, setBairrosExpanded] = useState(false);
  const [situacaoExpanded, setSituacaoExpanded] = useState(false);

  // Estado para outros filtros
  const [filters, setFilters] = useState({
    categoria: "",
    status: "",
    situacao: "",
    cadastro: "",
    bairros: "",
  });

  // ✅ Estados para armazenar mapeamentos localmente
  const [situacoesMapeamento, setSituacoesMapeamento] = useState({});
  const [bairrosMapeamento, setBairrosMapeamento] = useState({});

  // Opções de situação
  const situacaoOptionsHardcoded = [
    "EM CONSTRUÇÃO",
    "LANÇAMENTO", 
    "PRÉ-LANÇAMENTO",
    "PRONTO NOVO",
    "PRONTO USADO"
  ];

  // ✅ Função auxiliar para capitalização (mantida dos bairros que funcionaram)
  const capitalizarNomesProprios = (texto) => {
    if (!texto || typeof texto !== 'string') return texto;
    
    return texto.split(' ').map(palavra => {
      if (palavra.length === 0) return palavra;
      return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
    }).join(' ');
  };

  // ✅ useEffect para situações - CORRIGIDO para usar a mesma lógica dos bairros
  useEffect(() => {
    async function fetchFilterData() {
      try {
        console.log("🚨 ===== DEBUG SITUAÇÃO - INÍCIO (SÓ MAIÚSCULAS) =====");
        
        const [catResponse, cidResponse, sitResponse] = await Promise.all([
          getImoveisByFilters("Categoria"),
          getImoveisByFilters("Cidade"),
          getImoveisByFilters("Situacao")
        ]);

        setCategorias(catResponse.data || []);
        setCidades(cidResponse.data || []);
        
        if (sitResponse?.data && Array.isArray(sitResponse.data) && sitResponse.data.length > 0) {
          const situacoesBrutas = sitResponse.data.filter(s => s && s.toString().trim() !== '');
          
          console.log("📥 [SITUAÇÃO] Situações BRUTAS recebidas do backend:");
          situacoesBrutas.forEach((sit, i) => {
            console.log(`   ${i}: "${sit}" (tipo: ${typeof sit})`);
          });
          
          // ✅ APLICAR A MESMA LÓGICA DOS BAIRROS (que funciona!)
          console.log("🔄 [SITUAÇÃO] Aplicando lógica SÓ MAIÚSCULAS...");
          
          const novoMapeamento = {};
          const situacoesParaUI = new Set();
          
          // Criar mapeamento por chave normalizada (igual aos bairros)
          situacoesBrutas.forEach((situacaoOriginal, index) => {
            if (situacaoOriginal && situacaoOriginal.toString().trim() !== '') {
              const chave = situacaoOriginal.toLowerCase().trim();
              
              console.log(`   ${index}: "${situacaoOriginal}" → chave: "${chave}"`);
              
              if (!novoMapeamento[chave]) {
                novoMapeamento[chave] = [];
                console.log(`     ✅ Nova chave criada: "${chave}"`);
              }
              
              if (!novoMapeamento[chave].includes(situacaoOriginal)) {
                novoMapeamento[chave].push(situacaoOriginal);
                console.log(`     ✅ Situação "${situacaoOriginal}" adicionada à chave "${chave}"`);
              } else {
                console.log(`     ⚠️ Situação "${situacaoOriginal}" já existe na chave "${chave}"`);
              }
            }
          });
          
          console.log("📊 [SITUAÇÃO] Mapeamento criado:");
          Object.keys(novoMapeamento).forEach(chave => {
            console.log(`   "${chave}" → [${novoMapeamento[chave].join(', ')}] (${novoMapeamento[chave].length} variações)`);
          });
          
          // Criar versões para UI - PRIORIZAR MAIÚSCULAS SEMPRE
          Object.keys(novoMapeamento).forEach(chave => {
            const situacoesGrupo = novoMapeamento[chave];
            
            // ✅ EXCLUSÃO: Pular chave "pronto para morar"
            if (chave === "pronto para morar") {
              console.log(`   🚫 EXCLUINDO chave "${chave}" da interface`);
              return;
            }
            
            // ✅ PRIORIZAR: Buscar APENAS versões COMPLETAMENTE MAIÚSCULAS
            const versaoMaiuscula = situacoesGrupo.find(s => {
              const somenteLetrasEspacos = s.replace(/[^A-Za-záàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s-]/g, '');
              return somenteLetrasEspacos === somenteLetrasEspacos.toUpperCase() && s.trim() !== "";
            });
            
            // ✅ SÓ ADICIONAR SE ENCONTROU VERSÃO MAIÚSCULA
            if (versaoMaiuscula) {
              console.log(`   ✅ Usando versão MAIÚSCULA: "${versaoMaiuscula}" para chave "${chave}"`);
              situacoesParaUI.add(versaoMaiuscula);
            } else {
              console.log(`   ❌ NENHUMA versão maiúscula para chave "${chave}", pulando`);
            }
          });
          
          const situacoesFinais = Array.from(situacoesParaUI).sort();
          
          console.log("🎨 [SITUAÇÃO] Situações FINAIS para interface:");
          situacoesFinais.forEach((sit, i) => {
            console.log(`   ${i}: "${sit}"`);
          });
          
          console.log("💾 [SITUAÇÃO] Salvando estados...");
          setSituacoesReais(situacoesFinais);
          setSituacoesMapeamento(novoMapeamento);
          
          console.log("🚨 ===== DEBUG SITUAÇÃO - SUCESSO (CORRIGIDA) =====");
          
        } else {
          console.log("⚠️ [SITUAÇÃO] Sem dados do backend, usando hardcoded");
          setSituacoesReais(situacaoOptionsHardcoded);
          setSituacoesMapeamento({});
        }

      } catch (error) {
        console.error("❌ [SITUAÇÃO] ERRO:", error);
        setSituacoesReais(situacaoOptionsHardcoded);
        setSituacoesMapeamento({});
      }
    }
    fetchFilterData();
  }, []);

  // ✅ MANTIDO: useEffect para bairros (funcionando corretamente)
  useEffect(() => {
    async function fetchBairros() {
      if (!cidadeSelecionada) {
        setBairros([]);
        setBairrosReais([]);
        setBairrosMapeamento({});
        return;
      }

      try {
        const response = await getBairrosPorCidade(cidadeSelecionada, categoriaSelecionada);
        const bairrosBrutos = response?.data || [];
        
        if (bairrosBrutos.length > 0) {
          const novoMapeamentoBairros = {};
          const bairrosParaUI = new Set();
          
          // Criar mapeamento por chave normalizada
          bairrosBrutos.forEach(bairroOriginal => {
            if (bairroOriginal && bairroOriginal.toString().trim() !== '') {
              const chave = bairroOriginal.toLowerCase().trim();
              
              if (!novoMapeamentoBairros[chave]) {
                novoMapeamentoBairros[chave] = [];
              }
              
              if (!novoMapeamentoBairros[chave].includes(bairroOriginal)) {
                novoMapeamentoBairros[chave].push(bairroOriginal);
              }
            }
          });
          
          // Criar versões para UI
          Object.keys(novoMapeamentoBairros).forEach(chave => {
            const bairrosGrupo = novoMapeamentoBairros[chave];
            
            const versaoCapitalizada = bairrosGrupo.find(b => 
              b === capitalizarNomesProprios(b)
            );
            
            const melhorVersao = versaoCapitalizada || capitalizarNomesProprios(bairrosGrupo[0]);
            bairrosParaUI.add(melhorVersao);
          });
          
          const bairrosFinais = Array.from(bairrosParaUI).sort();
          
          setBairrosReais(bairrosFinais);
          setBairros(bairrosFinais);
          setBairrosMapeamento(novoMapeamentoBairros);
          
        } else {
          setBairros([]);
          setBairrosReais([]);
          setBairrosMapeamento({});
        }
      } catch (error) {
        console.error("❌ [BAIRROS] Erro ao buscar bairros:", error);
        setBairros([]);
        setBairrosReais([]);
        setBairrosMapeamento({});
      }
    }
    fetchBairros();
  }, [cidadeSelecionada, categoriaSelecionada]);

  // useEffect para restaurar filtros do cache
  useEffect(() => {
    const restoreFiltersFromCache = () => {
      try {
        const savedFilters = localStorage.getItem("admin_appliedFilters");
        
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters);
          console.log('[FILTERS CACHE] Restaurando filtros salvos:', parsedFilters);
          
          // Restaurar estados básicos
          if (parsedFilters.Categoria) {
            setCategoriaSelecionada(parsedFilters.Categoria);
            setFilters(prev => ({ ...prev, categoria: parsedFilters.Categoria }));
          }
          
          if (parsedFilters.Status) {
            setFilters(prev => ({ ...prev, status: parsedFilters.Status }));
          }
          
          if (parsedFilters.Ativo) {
            setFilters(prev => ({ ...prev, cadastro: parsedFilters.Ativo }));
          }
          
          if (parsedFilters.Cidade) {
            setCidadeSelecionada(parsedFilters.Cidade);
          }
          
          // Restaurar situações múltiplas
          if (parsedFilters.Situacao) {
            if (Array.isArray(parsedFilters.Situacao)) {
              setSituacoesSelecionadas(parsedFilters.Situacao);
            } else if (typeof parsedFilters.Situacao === 'string') {
              const situacoesArray = parsedFilters.Situacao.split(',').map(s => s.trim());
              setSituacoesSelecionadas(situacoesArray);
            } else {
              setFilters(prev => ({ ...prev, situacao: parsedFilters.Situacao }));
            }
          }
          
          // Restaurar bairros se existirem
          if (parsedFilters.bairros && Array.isArray(parsedFilters.bairros)) {
            setBairrosSelecionados(parsedFilters.bairros);
          }
          
          // Restaurar valores numéricos
          if (parsedFilters.ValorMin) {
            setValorMin(typeof parsedFilters.ValorMin === 'number' ? parsedFilters.ValorMin : parseFloat(parsedFilters.ValorMin));
          }
          
          if (parsedFilters.ValorMax) {
            setValorMax(typeof parsedFilters.ValorMax === 'number' ? parsedFilters.ValorMax : parseFloat(parsedFilters.ValorMax));
          }
          
          if (parsedFilters.AreaMin) {
            setAreaMin(typeof parsedFilters.AreaMin === 'number' ? parsedFilters.AreaMin : parseInt(parsedFilters.AreaMin));
          }
          
          if (parsedFilters.AreaMax) {
            setAreaMax(typeof parsedFilters.AreaMax === 'number' ? parsedFilters.AreaMax : parseInt(parsedFilters.AreaMax));
          }
        }
      } catch (error) {
        console.error('[FILTERS CACHE] Erro ao restaurar filtros:', error);
      }
    };
    
    const timeoutId = setTimeout(restoreFiltersFromCache, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (bairrosRef.current && !bairrosRef.current.contains(event.target)) {
        setBairrosExpanded(false);
      }
      if (situacaoRef.current && !situacaoRef.current.contains(event.target)) {
        setSituacaoExpanded(false);
      }
    }

    if (bairrosExpanded || situacaoExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [bairrosExpanded, situacaoExpanded]);

  // Funções utilitárias para formatação
  const formatarParaReal = (valor) => {
    if (valor === null || valor === undefined || valor === 0) return "";
    try {
      return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } catch (e) {
      return String(valor);
    }
  };

  const converterParaNumero = (valorFormatado) => {
    if (!valorFormatado || valorFormatado.trim() === "") return null;
    const valorLimpo = valorFormatado.replace(/[^\d]/g, "");
    return valorLimpo === "" ? null : Number(valorLimpo);
  };

  const formatarArea = (valor) => {
    return valor ? valor.toString() : "";
  };

  // Filtrar bairros e situações
  const bairrosFiltrados = bairrosReais.filter((bairro) =>
    bairro.toLowerCase().includes(bairroFilter.toLowerCase())
  );

  const situacoesFiltradas = situacoesReais.filter((situacao) =>
    situacao.toLowerCase().includes(situacaoFilter.toLowerCase())
  );

  // Handlers de manipulação
  const handleBairroChange = (bairro) => {
    setBairrosSelecionados((prev) =>
      prev.includes(bairro) ? prev.filter((b) => b !== bairro) : [...prev, bairro]
    );
  };

  const handleSituacaoChange = (situacao) => {
    setSituacoesSelecionadas((prev) => {
      const isSelected = prev.includes(situacao);
      const newSituacoes = isSelected 
        ? prev.filter((s) => s !== situacao) 
        : [...prev, situacao];
      
      console.log('🔍 [SITUAÇÃO UI] Situação alterada:', situacao);
      console.log('🔍 [SITUAÇÃO UI] Novas situações selecionadas:', newSituacoes);
      
      return newSituacoes;
    });
  };

  // ✅ FUNÇÃO CORRIGIDA: Versão INCLUSIVA para recuperar os 98 imóveis
  const normalizarSituacaoParaAPI = (situacoesSelecionadas) => {
    console.log("🔓 ===== SITUAÇÃO API (VERSÃO INCLUSIVA) =====");
    
    if (!Array.isArray(situacoesSelecionadas) || situacoesSelecionadas.length === 0) {
      console.log('❌ [API SITUAÇÃO] Nenhuma situação selecionada');
      return undefined;
    }

    console.log('📋 [API SITUAÇÃO] Situações selecionadas na UI:', situacoesSelecionadas);
    console.log('📋 [API SITUAÇÃO] Total selecionadas:', situacoesSelecionadas.length);
    
    const todasVariacoesSituacao = [];
    
    situacoesSelecionadas.forEach((situacaoSelecionada, index) => {
      const chave = situacaoSelecionada.toLowerCase().trim();
      
      console.log(`🔍 [API SITUAÇÃO] [${index}] Processando: "${situacaoSelecionada}" → chave: "${chave}"`);
      
      if (situacoesMapeamento[chave] && situacoesMapeamento[chave].length > 0) {
        console.log(`✅ [API SITUAÇÃO] [${index}] MAPEAMENTO ENCONTRADO: ${situacoesMapeamento[chave].length} variações`);
        console.log(`   Variações originais: [${situacoesMapeamento[chave].join(', ')}]`);
        
        // ✅ VERSÃO INCLUSIVA: Incluir TODAS as variações, exceto "pronto para morar" específico
        const variacoesValidas = situacoesMapeamento[chave].filter(variacao => {
          // ✅ EXCLUIR apenas "pronto para morar" exato (não outras variações com "pronto")
          const ehProntoParaMorarExato = variacao.toLowerCase().trim() === 'pronto para morar';
          
          if (ehProntoParaMorarExato) {
            console.log(`   🚫 EXCLUINDO: "${variacao}" (pronto para morar específico)`);
            return false;
          }
          
          // ✅ INCLUIR TUDO: maiúsculas, minúsculas, mistas
          console.log(`   ✅ INCLUINDO: "${variacao}"`);
          return true;
        });
        
        if (variacoesValidas.length > 0) {
          todasVariacoesSituacao.push(...variacoesValidas);
          console.log(`   ✅ Adicionadas ${variacoesValidas.length} variações válidas`);
        } else {
          console.log(`   ❌ NENHUMA variação válida para "${situacaoSelecionada}"`);
        }
      } else {
        console.log(`⚠️ [API SITUAÇÃO] [${index}] SEM MAPEAMENTO para "${chave}"`);
        
        // ✅ VERIFICAR se não é "pronto para morar" antes de adicionar
        const ehProntoParaMorarExato = situacaoSelecionada.toLowerCase().trim() === 'pronto para morar';
        
        if (!ehProntoParaMorarExato) {
          console.log(`   ✅ Valor original "${situacaoSelecionada}" incluído`);
          todasVariacoesSituacao.push(situacaoSelecionada);
        } else {
          console.log(`   🚫 Valor original "${situacaoSelecionada}" excluído (pronto para morar)`);
        }
      }
    });

    // Remover duplicatas
    const situacoesSemDuplicatas = [...new Set(todasVariacoesSituacao)];
    
    console.log("🎯 [API SITUAÇÃO] RESULTADO INCLUSIVO:");
    console.log("   Situações na UI:", situacoesSelecionadas.length);
    console.log("   Variações totais encontradas:", todasVariacoesSituacao.length);
    console.log("   Após remoção de duplicatas:", situacoesSemDuplicatas.length);
    console.log("   Multiplicador:", (situacoesSemDuplicatas.length / situacoesSelecionadas.length).toFixed(2), ":1");
    console.log("   Situações finais:", situacoesSemDuplicatas);
    console.log("🔓 ===== SITUAÇÃO API (VERSÃO INCLUSIVA) - FIM =====");
    
    return situacoesSemDuplicatas;
  };

  // ✅ MANTIDO: Normalizar bairros para API (funcionando)
  const normalizarBairrosParaAPI = (bairrosSelecionados) => {
    if (!Array.isArray(bairrosSelecionados) || bairrosSelecionados.length === 0) {
      return undefined;
    }

    const todasVariacoes = [];
    
    bairrosSelecionados.forEach(bairroSelecionado => {
      const chave = bairroSelecionado.toLowerCase().trim();
      
      if (bairrosMapeamento[chave] && bairrosMapeamento[chave].length > 0) {
        todasVariacoes.push(...bairrosMapeamento[chave]);
      } else {
        todasVariacoes.push(bairroSelecionado);
      }
    });

    return [...new Set(todasVariacoes)];
  };

  // handleFilters com debug
  const handleFilters = () => {
    console.log("🚨 ================================");
    console.log("🚨 APLICANDO FILTROS - VERSÃO INCLUSIVA");
    console.log("🚨 ================================");
    
    console.log("📋 [FILTROS] Situações selecionadas na interface:", situacoesSelecionadas);
    console.log("📋 [FILTROS] Total de situações selecionadas:", situacoesSelecionadas.length);
    console.log("📋 [FILTROS] Mapeamento disponível:", Object.keys(situacoesMapeamento));
    
    // ✅ CHAMAR A VERSÃO INCLUSIVA
    console.log("🔥 [FILTROS] CHAMANDO normalizarSituacaoParaAPI INCLUSIVA...");
    const situacaoProcessada = normalizarSituacaoParaAPI(situacoesSelecionadas);
    console.log("🧪 [FILTROS] RESULTADO da normalizarSituacaoParaAPI:", situacaoProcessada);
    console.log("🧪 [FILTROS] TIPO:", typeof situacaoProcessada);
    console.log("🧪 [FILTROS] É ARRAY:", Array.isArray(situacaoProcessada));
    console.log("🧪 [FILTROS] COMPRIMENTO:", situacaoProcessada?.length || 0);
    
    // ✅ ANÁLISE DE MULTIPLICAÇÃO
    if (situacoesSelecionadas.length > 0 && situacaoProcessada) {
      const multiplicador = situacaoProcessada.length / situacoesSelecionadas.length;
      console.log("📊 [FILTROS] ANÁLISE DE MULTIPLICAÇÃO:");
      console.log(`   Situações na UI: ${situacoesSelecionadas.length}`);
      console.log(`   Situações para API: ${situacaoProcessada.length}`);
      console.log(`   Multiplicador: ${multiplicador.toFixed(2)}x`);
      
      if (multiplicador > 1.5) {
        console.log(`💡 [FILTROS] MULTIPLICADOR ALTO: ${multiplicador.toFixed(2)}x pode recuperar os imóveis faltando!`);
      }
    }
    
    const filtersToApply = {
      Categoria: filters.categoria || categoriaSelecionada,
      Status: filters.status,
      Situacao: situacaoProcessada || filters.situacao || undefined,
      Ativo: filters.cadastro,
      Cidade: cidadeSelecionada,
      bairros: normalizarBairrosParaAPI(bairrosSelecionados) || undefined,
      ValorMin: valorMin,
      ValorMax: valorMax,
      AreaMin: areaMin,
      AreaMax: areaMax,
    };

    // Remover campos undefined para clareza
    const filtersForAPI = {};
    Object.keys(filtersToApply).forEach(key => {
      if (filtersToApply[key] !== undefined && filtersToApply[key] !== null && filtersToApply[key] !== '') {
        filtersForAPI[key] = filtersToApply[key];
      }
    });

    console.log("📤 FILTROS FINAIS ENVIADOS PARA API:");
    console.log(JSON.stringify(filtersForAPI, null, 2));

    if (filtersForAPI.Situacao) {
      console.log("🎯 SITUAÇÃO ENVIADA PARA API (INCLUSIVA):", filtersForAPI.Situacao);
      console.log("🎯 TIPO DA SITUAÇÃO:", typeof filtersForAPI.Situacao);
      console.log("🎯 É ARRAY:", Array.isArray(filtersForAPI.Situacao));
      if (Array.isArray(filtersForAPI.Situacao)) {
        console.log("🎯 COMPRIMENTO DO ARRAY:", filtersForAPI.Situacao.length);
        console.log("🎯 ITENS DO ARRAY:", filtersForAPI.Situacao.map((s, i) => `  ${i}: "${s}"`));
      }
    } else {
      console.log("⚠️ NENHUMA SITUAÇÃO NO FILTRO FINAL");
    }

    console.log("🚨 ================================");

    if (onFilter) {
      onFilter(filtersToApply);
    }
  };

  // ✅ MANTIDO: handleClearFilters com limpeza completa do cache
  const handleClearFilters = () => {
    console.log("🧹 [CLEAR] Iniciando limpeza completa dos filtros...");
    
    // Limpar estados dos filtros
    setFilters({
      categoria: "",
      status: "",
      situacao: "",
      cadastro: "",
    });
    setCategoriaSelecionada("");
    setCidadeSelecionada("");
    setBairrosSelecionados([]);
    setSituacoesSelecionadas([]);
    setBairroFilter("");
    setSituacaoFilter("");
    setValorMin(null);
    setValorMax(null);
    setAreaMin(null);
    setAreaMax(null);
    setSituacoesMapeamento({});
    setBairrosMapeamento({});

    // ✅ LIMPEZA COMPLETA DO CACHE DO LOCALSTORAGE
    console.log("🧹 [CLEAR] Limpando cache do localStorage...");
    
    // Limpar todos os caches relacionados aos filtros
    localStorage.removeItem("admin_appliedFilters");
    localStorage.removeItem("admin_filterResults");
    localStorage.removeItem("admin_filterPagination");
    
    // Limpar também cache de busca livre se existir
    localStorage.removeItem("admin_searchTerm");
    localStorage.removeItem("admin_searchResults");
    localStorage.removeItem("admin_searchPagination");
    
    console.log("✅ [CLEAR] Cache limpo com sucesso!");
    console.log("🔄 [CLEAR] Aplicando filtros vazios...");

    // Aplicar filtros vazios
    if (onFilter) {
      onFilter({});
    }
    
    console.log("✅ [CLEAR] Limpeza completa finalizada!");
  };

  // ✅ NOVA FUNÇÃO: Investigar problemas de migração (SIMPLES)
  const investigarMigracao = async () => {
    console.log("🔍 ===== INVESTIGAÇÃO SIMPLES: MIGRAÇÃO =====");
    
    try {
      // Importar a função necessária
      const { getImoveisDashboard } = await import("../services/imoveis");
      
      // Buscar amostra de 100 imóveis
      console.log("📡 Buscando amostra de 100 imóveis...");
      const response = await getImoveisDashboard({}, 1, 100);
      const imoveis = response?.data || [];
      const total = response?.paginacao?.totalItems || 0;
      
      console.log(`📊 Total geral: ${total} imóveis`);
      console.log(`📊 Amostra: ${imoveis.length} imóveis`);
      
      // Analisar situações
      let problemasEncontrados = 0;
      const tiposProblemas = {
        'NULL': 0,
        'Vazio ""': 0,
        'Espaços': 0,
        'undefined': 0,
        'Outros': 0
      };
      
      console.log("\n🔍 Analisando situações...");
      
      imoveis.forEach((imovel, i) => {
        const situacao = imovel.Situacao;
        let temProblema = false;
        
        if (situacao === null) {
          tiposProblemas['NULL']++;
          temProblema = true;
        } else if (situacao === undefined) {
          tiposProblemas['undefined']++;
          temProblema = true;
        } else if (situacao === '') {
          tiposProblemas['Vazio ""']++;
          temProblema = true;
        } else if (typeof situacao === 'string' && situacao.trim() === '') {
          tiposProblemas['Espaços']++;
          temProblema = true;
        } else if (!situacao || (typeof situacao !== 'string')) {
          tiposProblemas['Outros']++;
          temProblema = true;
        }
        
        if (temProblema) {
          problemasEncontrados++;
          if (problemasEncontrados <= 5) { // Mostrar apenas os primeiros 5
            console.log(`   ${i+1}. Código ${imovel.Codigo}: situação = ${JSON.stringify(situacao)}`);
          }
        }
      });
      
      console.log("\n📊 RESUMO DOS PROBLEMAS:");
      Object.entries(tiposProblemas).forEach(([tipo, qtd]) => {
        if (qtd > 0) {
          console.log(`   ${tipo}: ${qtd} imóveis`);
        }
      });
      
      console.log(`\n🚨 Total com problemas: ${problemasEncontrados}/${imoveis.length}`);
      
      // Estimar impacto
      if (problemasEncontrados > 0) {
        const percentual = (problemasEncontrados / imoveis.length) * 100;
        const estimativa = Math.round((total * percentual) / 100);
        
        console.log(`\n💡 ESTIMATIVA TOTAL:`);
        console.log(`   Percentual problemático: ${percentual.toFixed(1)}%`);
        console.log(`   Estimativa total: ${estimativa} imóveis`);
        
        if (estimativa >= 80) {
          console.log(`🎯 BINGO! Estes ${estimativa} imóveis podem ser os 96 faltando!`);
          console.log(`\n🔧 SOLUÇÃO: Execute este SQL no banco:`);
          console.log(`   UPDATE imoveis SET situacao = 'SEM SITUAÇÃO' WHERE situacao IS NULL;`);
          console.log(`   UPDATE imoveis SET situacao = 'SEM SITUAÇÃO' WHERE situacao = '';`);
          console.log(`   UPDATE imoveis SET situacao = 'SEM SITUAÇÃO' WHERE TRIM(situacao) = '';`);
        } else {
          console.log(`⚠️ Poucos problemas encontrados. Causa pode estar em outro lugar.`);
        }
      } else {
        console.log(`✅ Nenhum problema de migração encontrado na amostra.`);
      }
      
    } catch (error) {
      console.error("❌ Erro:", error);
    }
    
    console.log("🔍 ===== FIM INVESTIGAÇÃO MIGRAÇÃO =====");
  };

  return (
    <div className="w-full mt-4 flex flex-col gap-4 border-t py-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SelectFilter
          name="cadastro"
          options={[
            { value: "Sim", label: "Sim" },
            { value: "Não", label: "Não" },
          ]}
          placeholder="Cadastro"
          onChange={(e) => setFilters({ ...filters, cadastro: e.target.value })}
          value={filters.cadastro}
        />
        
        <SelectFilter
          name="categoria"
          options={categorias.map((cat) => ({ value: cat, label: cat }))}
          placeholder="Categoria"
          onChange={(e) => {
            setCategoriaSelecionada(e.target.value);
            setFilters({ ...filters, categoria: e.target.value });
          }}
          value={filters.categoria || categoriaSelecionada}
        />
        
        <SelectFilter
          name="status"
          options={[
            { value: "LOCAÇÃO", label: "LOCAÇÃO" },
            { value: "LOCADO", label: "LOCADO" },
            { value: "PENDENTE", label: "PENDENTE" },
            { value: "SUSPENSO", label: "SUSPENSO" },
            { value: "VENDA", label: "VENDA" },
            { value: "VENDA E LOCAÇÃO", label: "VENDA E LOCAÇÃO" },
            { value: "VENDIDO", label: "VENDIDO" },
          ]}
          placeholder="Status"
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          value={filters.status}
        />
        
        {/* ✅ DROPDOWN DE SITUAÇÃO MANTIDO */}
        <div ref={situacaoRef} className="relative">
          <label htmlFor="situacao" className="text-xs text-gray-500 block mb-2">
            situacao
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Selecionar situações"
              value={situacaoFilter}
              onChange={(e) => setSituacaoFilter(e.target.value)}
              onClick={() => setSituacaoExpanded(true)}
              className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2 focus:outline-none focus:ring-1 focus:ring-black"
            />

            {situacoesSelecionadas.length > 0 && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                {situacoesSelecionadas.length}
              </div>
            )}

            {situacaoExpanded && (
              <div className="absolute z-50 w-full mt-1 border border-gray-200 rounded-md bg-white max-h-40 overflow-y-auto shadow-lg">
                {situacoesFiltradas.length > 0 ? (
                  <>
                    <div className="flex justify-between border-b border-gray-100 px-2 py-1">
                      <button
                        onClick={() => setSituacoesSelecionadas(situacoesFiltradas)}
                        className="text-[10px] text-black hover:underline"
                      >
                        Selecionar todos
                      </button>
                      <button
                        onClick={() => setSituacoesSelecionadas([])}
                        className="text-[10px] text-black hover:underline"
                      >
                        Limpar todos
                      </button>
                    </div>
                    
                    <div className="px-2 py-1 text-[9px] text-gray-400 border-b border-gray-100">
                      🔓 VERSÃO INCLUSIVA: {situacoesReais.length} situações ({Object.keys(situacoesMapeamento).length} chaves mapeadas)
                    </div>
                    
                    {situacoesFiltradas.map((situacao, index) => {
                      const chave = situacao.toLowerCase().trim();
                      const variacoes = situacoesMapeamento[chave] || [];
                      
                      return (
                        <div key={`${situacao}-${index}`} className="flex items-center px-2 py-1 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id={`situacao-${situacao}-${index}`}
                            checked={situacoesSelecionadas.includes(situacao)}
                            onChange={() => handleSituacaoChange(situacao)}
                            className="mr-2 h-4 w-4"
                          />
                          <label
                            htmlFor={`situacao-${situacao}-${index}`}
                            className="text-xs cursor-pointer flex-1 flex justify-between"
                          >
                            <span>{situacao}</span>
                            {variacoes.length > 1 && (
                              <span className="text-green-500 text-[8px] font-bold" title={`INCLUSIVO: ${variacoes.length} variações: ${variacoes.join(', ')}`}>
                                {variacoes.length}x
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="px-2 py-1 text-xs text-gray-500">
                    {situacaoFilter ? "Nenhuma situação encontrada" : "Carregando situações..."}
                  </div>
                )}
                <button
                  onClick={() => setSituacaoExpanded(false)}
                  className="text-xs text-black bg-gray-100 w-full py-1 rounded-b-md"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>

        <SelectFilter
          name="cidade"
          options={cidades.map((cidade) => ({ value: cidade, label: cidade }))}
          placeholder="Cidade"
          onChange={(e) => setCidadeSelecionada(e.target.value)}
          value={cidadeSelecionada}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ✅ DROPDOWN DE BAIRROS MANTIDO (funcionando) */}
        <div ref={bairrosRef}>
          <label htmlFor="bairros" className="text-xs text-gray-500 block mb-2">
            Bairros
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Selecionar bairros"
              value={bairroFilter}
              onChange={(e) => setBairroFilter(e.target.value)}
              onClick={() => setBairrosExpanded(true)}
              disabled={!cidadeSelecionada}
              className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2 focus:outline-none focus:ring-1 focus:ring-black"
            />

            {bairrosSelecionados.length > 0 && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                {bairrosSelecionados.length}
              </div>
            )}

            {bairrosExpanded && cidadeSelecionada && (
              <div className="absolute z-10 w-full mt-1 border border-gray-200 rounded-md bg-white max-h-40 overflow-y-auto">
                {bairrosFiltrados.length > 0 ? (
                  <>
                    <div className="flex justify-between border-b border-gray-100 px-2 py-1">
                      <button
                        onClick={() => setBairrosSelecionados(bairrosFiltrados)}
                        className="text-[10px] text-black hover:underline"
                      >
                        Selecionar todos
                      </button>
                      <button
                        onClick={() => setBairrosSelecionados([])}
                        className="text-[10px] text-black hover:underline"
                      >
                        Limpar todos
                      </button>
                    </div>
                    
                    <div className="px-2 py-1 text-[9px] text-gray-400 border-b border-gray-100">
                      Debug: {bairrosReais.length} bairros ({Object.keys(bairrosMapeamento).length} chaves mapeadas)
                    </div>
                    
                    {bairrosFiltrados.map((bairro, index) => {
                      const chave = bairro.toLowerCase().trim();
                      const variacoes = bairrosMapeamento[chave] || [];
                      
                      return (
                        <div key={`${bairro}-${index}`} className="flex items-center px-2 py-1 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id={`bairro-${bairro}-${index}`}
                            checked={bairrosSelecionados.includes(bairro)}
                            onChange={() => handleBairroChange(bairro)}
                            className="mr-2 h-4 w-4"
                          />
                          <label
                            htmlFor={`bairro-${bairro}-${index}`}
                            className="text-xs cursor-pointer flex-1 flex justify-between"
                          >
                            <span>{bairro}</span>
                            {variacoes.length > 1 && (
                              <span className="text-green-500 text-[8px] font-bold" title={`${variacoes.length} variações: ${variacoes.join(', ')}`}>
                                {variacoes.length}x
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="px-2 py-1 text-xs text-gray-500">
                    {bairroFilter ? "Nenhum bairro encontrado" : "Selecione uma cidade primeiro"}
                  </div>
                )}
                <button
                  onClick={() => setBairrosExpanded(false)}
                  className="text-xs text-black bg-gray-100 w-full py-1 rounded-b-md"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Faixa de Valores */}
        <div>
          <label className="text-xs text-gray-500 block mb-2">Faixa de Valor</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Valor Mínimo"
              value={valorMin ? formatarParaReal(valorMin) : ""}
              onChange={(e) => setValorMin(converterParaNumero(e.target.value))}
              className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2 focus:outline-none focus:ring-1 focus:ring-black"
            />
            <input
              type="text"
              placeholder="Valor Máximo"
              value={valorMax ? formatarParaReal(valorMax) : ""}
              onChange={(e) => setValorMax(converterParaNumero(e.target.value))}
              className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        {/* Faixa de Área */}
        <div>
          <label className="text-xs text-gray-500 block mb-2">Área do Imóvel</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Área Mínima"
              value={areaMin ? formatarArea(areaMin) : ""}
              onChange={(e) => {
                const valor = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
                setAreaMin(valor ? parseInt(valor, 10) : null);
              }}
              className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2 focus:outline-none focus:ring-1 focus:ring-black"
            />
            <input
              type="text"
              placeholder="Área Máxima"
              value={areaMax ? formatarArea(areaMax) : ""}
              onChange={(e) => {
                const valor = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
                setAreaMax(valor ? parseInt(valor, 10) : null);
              }}
              className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>
      </div>

      {/* ✅ SEÇÃO DOS BOTÕES MODIFICADA COM BOTÃO DE MIGRAÇÃO */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        <button
          className="bg-gray-200 font-bold rounded-md text-zinc-600 hover:bg-zinc-300 p-2 text-xs"
          onClick={handleFilters}
        >
          🔓 Filtrar
        </button>
        
        <button
          className="bg-purple-500 font-bold rounded-md text-white hover:bg-purple-600 p-2 text-xs"
          onClick={investigarMigracao}
        >
          🔍 Migração
        </button>
        
        <button
          className="bg-red-100 font-bold rounded-md text-red-600 hover:bg-red-200 p-2 text-xs"
          onClick={handleClearFilters}
        >
          Limpar
        </button>
      </div>
    </div>
  );
}

function SelectFilter({ options, name, onChange, value, placeholder }) {
  return (
    <div>
      <label htmlFor={name} className="text-xs text-gray-500 block mb-2">
        {name}
      </label>
      <select
        name={name}
        className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2 focus:outline-none focus:ring-1 focus:ring-black"
        onChange={onChange}
        value={value || ""}
      >
        <option value="">{placeholder || `Selecione ${name}`}</option>
        {options.map((option, index) => (
          <option className="text-xs" key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
