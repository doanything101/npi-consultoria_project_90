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

  // 🔬 Estado para investigação
  const [investigandoSituacoes, setInvestigandoSituacoes] = useState(false);

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

  // 🔬 INVESTIGAÇÃO DIRETA: Buscar situações brutas do banco
  const investigarSituacoesBrutas = async () => {
    setInvestigandoSituacoes(true);
    console.log("🔬 ===== INVESTIGAÇÃO DIRETA: SITUAÇÕES BRUTAS =====");
    
    try {
      console.log("📡 Buscando dados brutos de múltiplas páginas...");
      
      // Usar a mesma função que carrega a página principal
      const paginas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 10 páginas = ~300 imóveis
      let todosImoveis = [];
      
      for (const pagina of paginas) {
        try {
          console.log(`📄 Carregando página ${pagina}...`);
          
          // Usar fetch direto na API que sabemos que funciona
          const response = await fetch(`/api/admin/imoveis?page=${pagina}&limit=30`);
          const dados = await response.json();
          
          if (dados && dados.data && Array.isArray(dados.data)) {
            todosImoveis.push(...dados.data);
            console.log(`   ✅ Página ${pagina}: ${dados.data.length} imóveis`);
          } else {
            console.log(`   ❌ Página ${pagina}: sem dados`);
          }
          
          // Se chegou no fim, parar
          if (!dados.data || dados.data.length === 0) {
            console.log(`   🏁 Fim dos dados na página ${pagina}`);
            break;
          }
          
        } catch (error) {
          console.log(`   ⚠️ Erro na página ${pagina}:`, error.message);
        }
      }
      
      console.log(`📊 TOTAL COLETADO: ${todosImoveis.length} imóveis`);
      
      if (todosImoveis.length === 0) {
        console.log("❌ Nenhum imóvel coletado da API");
        return;
      }
      
      // Mapear TODAS as situações únicas, incluindo problemas
      const estatisticas = {
        total: todosImoveis.length,
        comSituacao: 0,
        semSituacao: 0,
        situacaoNull: 0,
        situacaoVazia: 0,
        situacaoEspacos: 0,
        situacaoUndefined: 0
      };
      
      const situacoesUnicas = new Map(); // Map para contar frequência
      const exemplosSituacoes = new Map(); // Exemplos de códigos
      
      console.log("\n🔍 ANALISANDO CADA IMÓVEL...");
      
      todosImoveis.forEach((imovel, i) => {
        const situacao = imovel.Situacao;
        const codigo = imovel.Codigo || imovel.codigo || `sem-codigo-${i}`;
        
        // Classificar o tipo de situação
        if (situacao === null) {
          estatisticas.situacaoNull++;
          estatisticas.semSituacao++;
        } else if (situacao === undefined) {
          estatisticas.situacaoUndefined++;
          estatisticas.semSituacao++;
        } else if (situacao === '') {
          estatisticas.situacaoVazia++;
          estatisticas.semSituacao++;
        } else if (typeof situacao === 'string' && situacao.trim() === '') {
          estatisticas.situacaoEspacos++;
          estatisticas.semSituacao++;
        } else {
          // Situação válida
          estatisticas.comSituacao++;
          
          const situacaoStr = String(situacao).trim();
          
          if (situacaoStr) {
            // Contar frequência
            if (situacoesUnicas.has(situacaoStr)) {
              situacoesUnicas.set(situacaoStr, situacoesUnicas.get(situacaoStr) + 1);
            } else {
              situacoesUnicas.set(situacaoStr, 1);
              exemplosSituacoes.set(situacaoStr, []);
            }
            
            // Guardar exemplos
            const exemplos = exemplosSituacoes.get(situacaoStr);
            if (exemplos.length < 3) {
              exemplos.push(codigo);
            }
          }
        }
      });
      
      console.log("\n📊 ESTATÍSTICAS GERAIS:");
      console.log(`   Total de imóveis: ${estatisticas.total}`);
      console.log(`   Com situação válida: ${estatisticas.comSituacao}`);
      console.log(`   Sem situação: ${estatisticas.semSituacao}`);
      console.log(`   - NULL: ${estatisticas.situacaoNull}`);
      console.log(`   - Vazia (""): ${estatisticas.situacaoVazia}`);
      console.log(`   - Só espaços: ${estatisticas.situacaoEspacos}`);
      console.log(`   - Undefined: ${estatisticas.situacaoUndefined}`);
      
      console.log(`\n🎯 SITUAÇÕES ÚNICAS ENCONTRADAS: ${situacoesUnicas.size}`);
      console.log("\n📋 LISTA COMPLETA (ordenada por frequência):");
      
      // Ordenar por frequência (mais comum primeiro)
      const situacoesOrdenadas = Array.from(situacoesUnicas.entries())
        .sort((a, b) => b[1] - a[1]);
      
      situacoesOrdenadas.forEach(([situacao, count], index) => {
        const exemplos = exemplosSituacoes.get(situacao);
        console.log(`   ${index + 1}. "${situacao}" → ${count}x (${((count/estatisticas.comSituacao)*100).toFixed(1)}%) - Ex: ${exemplos.join(', ')}`);
      });
      
      // Comparar com a interface
      console.log(`\n🔍 COMPARAÇÃO COM INTERFACE:`);
      console.log(`   Situações na interface: ${situacoesReais.length}`);
      console.log(`   Situações no banco: ${situacoesUnicas.size}`);
      console.log(`   Diferença: ${situacoesUnicas.size - situacoesReais.length} situações ocultas`);
      
      console.log("\n📋 Situações da interface:", situacoesReais);
      
      // Encontrar situações ocultas
      const situacoesDaInterface = new Set(situacoesReais.map(s => s.toLowerCase().trim()));
      const situacoesOcultas = [];
      
      situacoesOrdenadas.forEach(([situacao, count]) => {
        const chaveNormalizada = situacao.toLowerCase().trim();
        if (!situacoesDaInterface.has(chaveNormalizada)) {
          situacoesOcultas.push({ situacao, count });
        }
      });
      
      if (situacoesOcultas.length > 0) {
        console.log(`\n🚨 SITUAÇÕES OCULTAS (${situacoesOcultas.length}):`);
        
        let totalImoveisOcultos = 0;
        situacoesOcultas.forEach(({situacao, count}, index) => {
          totalImoveisOcultos += count;
          const exemplos = exemplosSituacoes.get(situacao);
          const percentual = ((count/estatisticas.comSituacao)*100).toFixed(1);
          console.log(`   ${index + 1}. "${situacao}" → ${count}x (${percentual}%) - Ex: ${exemplos.join(', ')}`);
        });
        
        console.log(`\n💡 RESUMO DO PROBLEMA:`);
        console.log(`   Imóveis com situações ocultas: ${totalImoveisOcultos}`);
        console.log(`   Imóveis faltando nos filtros: 98`);
        console.log(`   Percentual na amostra: ${((totalImoveisOcultos/estatisticas.comSituacao)*100).toFixed(1)}%`);
        
        // Estimativa no total baseada na amostra
        const estimativaTotal = Math.round((5553 * totalImoveisOcultos) / estatisticas.comSituacao);
        console.log(`   Estimativa no total geral: ${estimativaTotal} imóveis`);
        
        if (totalImoveisOcultos >= 30) {
          console.log(`\n🎯 BINGO! ${totalImoveisOcultos} imóveis com situações ocultas explicam os 98 faltando!`);
          console.log(`\n🔧 PRÓXIMOS PASSOS:`);
          console.log(`   1. Adicionar estas situações ao filtro da interface`);
          console.log(`   2. Ou investigar por que não aparecem no getImoveisByFilters("Situacao")`);
        }
        
      } else {
        console.log("\n✅ Todas as situações do banco estão na interface");
        console.log("🤔 O problema deve estar em outro lugar (Status, Categoria, Ativo, etc.)");
      }
      
      // Verificar imóveis sem situação
      if (estatisticas.semSituacao > 0) {
        console.log(`\n⚠️ IMÓVEIS SEM SITUAÇÃO: ${estatisticas.semSituacao}`);
        console.log("💡 Estes imóveis podem estar sendo ignorados pelos filtros");
        
        const percentualSemSituacao = ((estatisticas.semSituacao/estatisticas.total)*100).toFixed(1);
        const estimativaSemSituacao = Math.round((5553 * estatisticas.semSituacao) / estatisticas.total);
        
        console.log(`   Percentual na amostra: ${percentualSemSituacao}%`);
        console.log(`   Estimativa no total: ${estimativaSemSituacao} imóveis`);
        
        if (estimativaSemSituacao >= 50) {
          console.log(`🎯 POSSÍVEL CAUSA! ${estimativaSemSituacao} imóveis sem situação podem explicar os 98 faltando!`);
        }
      }
      
    } catch (error) {
      console.error("❌ Erro na investigação direta:", error);
    } finally {
      setInvestigandoSituacoes(false);
    }
    
    console.log("🔬 ===== FIM INVESTIGAÇÃO DIRETA =====");
  };

  // ✅ useEffect para situações - VERSÃO INCLUSIVA TOTAL
  useEffect(() => {
    async function fetchFilterData() {
      try {
        console.log("🚨 ===== DEBUG SITUAÇÃO - VERSÃO INCLUSIVA TOTAL =====");
        
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
          
          console.log("🔄 [SITUAÇÃO] Aplicando lógica INCLUSIVA TOTAL...");
          
          const novoMapeamento = {};
          const situacoesParaUI = new Set();
          
          // Criar mapeamento por chave normalizada
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
          
          // ✅ INCLUIR TODAS as situações (versão inclusiva total)
          Object.keys(novoMapeamento).forEach(chave => {
            const situacoesGrupo = novoMapeamento[chave];
            
            console.log(`   🧪 INCLUINDO TODAS as variações de "${chave}"`);
            
            // Priorizar versão maiúscula se existir, senão usar a primeira
            const versaoMaiuscula = situacoesGrupo.find(s => {
              const somenteLetrasEspacos = s.replace(/[^A-Za-záàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s-]/g, '');
              return somenteLetrasEspacos === somenteLetrasEspacos.toUpperCase() && s.trim() !== "";
            });
            
            const situacaoParaUI = versaoMaiuscula || situacoesGrupo[0];
            
            if (situacaoParaUI) {
              console.log(`   ✅ Adicionando à UI: "${situacaoParaUI}"`);
              situacoesParaUI.add(situacaoParaUI);
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
          
          console.log("🚨 ===== DEBUG SITUAÇÃO - SUCESSO (INCLUSIVA TOTAL) =====");
          
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

  // ✅ FUNÇÃO CORRIGIDA: Versão TOTALMENTE INCLUSIVA
  const normalizarSituacaoParaAPI = (situacoesSelecionadas) => {
    console.log("🔓 ===== SITUAÇÃO API (VERSÃO TOTALMENTE INCLUSIVA) =====");
    
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
        
        // ✅ VERSÃO TOTALMENTE INCLUSIVA: Incluir TODAS as variações
        const variacoesValidas = situacoesMapeamento[chave];
        
        variacoesValidas.forEach(variacao => {
          console.log(`   ✅ INCLUINDO (TOTAL): "${variacao}"`);
        });
        
        todasVariacoesSituacao.push(...variacoesValidas);
        console.log(`   ✅ Adicionadas ${variacoesValidas.length} variações válidas`);
      } else {
        console.log(`⚠️ [API SITUAÇÃO] [${index}] SEM MAPEAMENTO para "${chave}"`);
        console.log(`   ✅ Valor original "${situacaoSelecionada}" incluído (TOTAL)`);
        todasVariacoesSituacao.push(situacaoSelecionada);
      }
    });

    // Remover duplicatas
    const situacoesSemDuplicatas = [...new Set(todasVariacoesSituacao)];
    
    console.log("🎯 [API SITUAÇÃO] RESULTADO TOTALMENTE INCLUSIVO:");
    console.log("   Situações na UI:", situacoesSelecionadas.length);
    console.log("   Variações totais encontradas:", todasVariacoesSituacao.length);
    console.log("   Após remoção de duplicatas:", situacoesSemDuplicatas.length);
    console.log("   Multiplicador:", (situacoesSemDuplicatas.length / situacoesSelecionadas.length).toFixed(2), ":1");
    console.log("   Situações finais:", situacoesSemDuplicatas);
    console.log("🔓 ===== SITUAÇÃO API (VERSÃO TOTALMENTE INCLUSIVA) - FIM =====");
    
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
    console.log("🚨 APLICANDO FILTROS - VERSÃO TOTALMENTE INCLUSIVA");
    console.log("🚨 ================================");
    
    console.log("📋 [FILTROS] Situações selecionadas na interface:", situacoesSelecionadas);
    console.log("📋 [FILTROS] Total de situações selecionadas:", situacoesSelecionadas.length);
    console.log("📋 [FILTROS] Mapeamento disponível:", Object.keys(situacoesMapeamento));
    
    // ✅ CHAMAR A VERSÃO TOTALMENTE INCLUSIVA
    console.log("🔥 [FILTROS] CHAMANDO normalizarSituacaoParaAPI TOTALMENTE INCLUSIVA...");
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
      console.log("🎯 SITUAÇÃO ENVIADA PARA API (TOTALMENTE INCLUSIVA):", filtersForAPI.Situacao);
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
        
        {/* ✅ DROPDOWN DE SITUAÇÃO TOTALMENTE INCLUSIVO */}
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
                      🔓 TOTALMENTE INCLUSIVO: {situacoesReais.length} situações ({Object.keys(situacoesMapeamento).length} chaves mapeadas)
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
                              <span className="text-green-500 text-[8px] font-bold" title={`TOTAL: ${variacoes.length} variações: ${variacoes.join(', ')}`}>
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

      {/* 🔬 BOTÕES DE AÇÃO - INCLUINDO INVESTIGAÇÃO */}
      <div className="flex flex-wrap gap-3 items-center pt-4 border-t">
        <button
          onClick={handleFilters}
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          Aplicar Filtros
        </button>

        <button
          onClick={handleClearFilters}
          className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
        >
          Limpar Filtros
        </button>

        {/* 🔬 BOTÃO DE INVESTIGAÇÃO */}
        <button
          onClick={investigarSituacoesBrutas}
          disabled={investigandoSituacoes}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            investigandoSituacoes
              ? 'bg-yellow-300 text-yellow-800 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {investigandoSituacoes ? '🔍 Investigando...' : '🔍 Investigar Situações'}
        </button>

        {/* 📊 INFORMAÇÕES DE DEBUG */}
        <div className="text-xs text-gray-500 flex items-center gap-4">
          <span>🎯 Situações: {situacoesReais.length}</span>
          <span>🗂️ Mapeamentos: {Object.keys(situacoesMapeamento).length}</span>
          {situacoesSelecionadas.length > 0 && (
            <span className="text-blue-600 font-medium">
              ✅ {situacoesSelecionadas.length} selecionadas
            </span>
          )}
        </div>
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
