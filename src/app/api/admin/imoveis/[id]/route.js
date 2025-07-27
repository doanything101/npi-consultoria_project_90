import { connectToDatabase } from "@/app/lib/mongodb";
import Imovel from "@/app/models/Imovel";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    
    let imovel = await Imovel.findOne({ Codigo: id });
    if (!imovel && id.match(/^[0-9a-fA-F]{24}$/)) {
      imovel = await Imovel.findById(id);
    }
    
    if (!imovel) {
      return NextResponse.json(
        { status: 404, message: "Imóvel não encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      status: 200,
      data: imovel,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 500, message: "Erro ao buscar imóvel", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { id } = params;

  try {
    await connectToDatabase();
    const dadosAtualizados = await request.json();
    
    console.group('📥 PUT - Processando atualização de imóvel');
    console.log('🆔 ID/Código recebido:', id);
    console.log('📊 Dados básicos:', {
      codigo: dadosAtualizados.Codigo,
      empreendimento: dadosAtualizados.Empreendimento,
      ativo: dadosAtualizados.Ativo,
      totalCampos: Object.keys(dadosAtualizados).length
    });

    // 🔒 Validação reforçada
    if (!id) {
      console.error('❌ ID não fornecido');
      console.groupEnd();
      return NextResponse.json(
        { status: 400, message: "ID do imóvel é obrigatório" },
        { status: 400 }
      );
    }

    // 🔍 Busca inteligente (código ou _id)
    let imovel;
    console.log('🔍 Buscando por Codigo:', id);
    imovel = await Imovel.findOne({ Codigo: id });
    
    if (imovel) {
      console.log('✅ Imóvel encontrado por Codigo:', imovel.Codigo);
    } else if (id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('🔍 Tentando busca por _id MongoDB...');
      imovel = await Imovel.findById(id);
      if (imovel) console.log('✅ Imóvel encontrado por _id:', imovel._id);
    }

    if (!imovel) {
      console.error('❌ Imóvel não encontrado com ID:', id);
      console.groupEnd();
      return NextResponse.json(
        { status: 404, message: "Imóvel não encontrado" },
        { status: 404 }
      );
    }

    console.log('📋 Imóvel localizado:', {
      codigo: imovel.Codigo,
      _id: imovel._id,
      empreendimento: imovel.Empreendimento,
      versaoAtual: imovel.__v
    });

    // 📸 Processamento AVANÇADO de fotos
    if (dadosAtualizados.Foto) {
      console.log('📸 Processando fotos...');
      let fotosProcessadas = [];
      
      if (Array.isArray(dadosAtualizados.Foto)) {
        console.log('📸 Fotos em formato array:', dadosAtualizados.Foto.length);
        
        // Processar cada foto
        fotosProcessadas = dadosAtualizados.Foto.map((foto, index) => {
          const ordemFinal = typeof foto.ordem === 'number' ? foto.ordem : index;
          const fotoProcessada = {
            Codigo: foto.Codigo || `photo-${Date.now()}-${index}`,
            Foto: foto.Foto || '',
            Destaque: foto.Destaque || "Nao",
            ordem: ordemFinal,
            _id: foto._id || undefined
          };

          // Preservar campos adicionais
          ['Ordem', 'ORDEM', 'Descricao', 'Alt'].forEach(campo => {
            if (foto[campo]) fotoProcessada[campo] = foto[campo];
          });

          return fotoProcessada;
        });

        // Ordenar fotos
        fotosProcessadas.sort((a, b) => a.ordem - b.ordem);
      } else if (typeof dadosAtualizados.Foto === 'object') {
        console.log('📸 Convertendo objeto de fotos para array...');
        fotosProcessadas = Object.entries(dadosAtualizados.Foto)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([key, foto], index) => ({
            ...foto,
            Codigo: key,
            ordem: foto.ordem !== undefined ? foto.ordem : index
          }));
      }

      // Tratamento especial para imóveis vendidos
      const isVendido = dadosAtualizados.Status === "Vendido" || imovel.Status === "Vendido";
      if (isVendido) {
        if (fotosProcessadas.length > 0 && fotosProcessadas[0].Destaque !== "Sim") {
          fotosProcessadas[0].Destaque = "Sim";
        }
        fotosProcessadas = fotosProcessadas.filter(foto => !foto._markedForDeletion);
      }

      dadosAtualizados.Foto = fotosProcessadas;
      console.log('📸 Fotos processadas:', fotosProcessadas.length);
    }

    // 🎥 Processamento de vídeos
    if (dadosAtualizados.Video) {
      console.log('🎥 Processando vídeos...');
      dadosAtualizados.Video = Array.isArray(dadosAtualizados.Video) 
        ? dadosAtualizados.Video 
        : Object.values(dadosAtualizados.Video || {});
      console.log('🎥 Vídeos processados:', dadosAtualizados.Video.length);
    }

    // ✨ Atualização segura dos campos
    const camposPermitidos = Object.keys(dadosAtualizados).filter(
      key => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key)
    );

    camposPermitidos.forEach(key => {
      if (dadosAtualizados[key] !== undefined) {
        imovel[key] = dadosAtualizados[key];
      }
    });

    // Marcar arrays como modificados
    ['Foto', 'Video'].forEach(campo => {
      if (dadosAtualizados[campo]) imovel.markModified(campo);
    });

    // 💾 Salvamento otimizado
    console.log('💾 Salvando documento no MongoDB...');
    const imovelAtualizado = await imovel.save({ 
      validateBeforeSave: false,
      timestamps: false
    });

    console.log('✅ Documento salvo com sucesso!');
    console.groupEnd();

    // 🎉 Resposta de sucesso
    return NextResponse.json({
      status: 200,
      success: true,
      data: {
        _id: imovelAtualizado._id,
        Codigo: imovelAtualizado.Codigo,
        Foto: imovelAtualizado.Foto?.map(f => ({
          Codigo: f.Codigo,
          ordem: f.ordem,
          Destaque: f.Destaque
        })),
        Status: imovelAtualizado.Status,
        updatedAt: new Date().toISOString()
      },
      message: "Imóvel atualizado com sucesso"
    });

  } catch (error) {
    console.error('❌ Erro na atualização:', error);
    console.groupEnd();
    
    // 🛑 Tratamento de erros específicos
    let status = 500;
    let message = "Erro ao atualizar imóvel";
    
    if (error.name === 'ValidationError') {
      status = 400;
      message = Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.code === 11000) {
      status = 409;
      message = "Código do imóvel já existe";
    } else if (error.name === 'CastError') {
      status = 400;
      message = "ID do imóvel inválido";
    } else if (error.name === 'VersionError') {
      status = 409;
      message = "Conflito de versão. Recarregue e tente novamente.";
    }

    return NextResponse.json(
      { status, success: false, message, error: error.message },
      { status }
    );
  }
}

// 🔥 PUT COMPLETO E OTIMIZADO
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    await connectToDatabase();
    const dadosAtualizados = await request.json();
    
    console.group('📥 PUT - Processando atualização de imóvel');
    console.log('🆔 ID/Código recebido:', id);
    console.log('📊 Dados básicos:', {
      codigo: dadosAtualizados.Codigo,
      empreendimento: dadosAtualizados.Empreendimento,
      ativo: dadosAtualizados.Ativo,
      totalCampos: Object.keys(dadosAtualizados).length
    });

    // 🔥 VALIDAÇÃO INICIAL
    if (!id) {
      console.error('❌ ID não fornecido');
      console.groupEnd();
      return NextResponse.json(
        { status: 400, message: "ID do imóvel é obrigatório" },
        { status: 400 }
      );
    }

    // 🔍 BUSCA INTELIGENTE DO IMÓVEL
    let imovel;
    
    // Primeiro: tentar buscar por Codigo (string personalizada)
    console.log('🔍 Buscando por Codigo:', id);
    imovel = await Imovel.findOne({ Codigo: id });
    
    if (imovel) {
      console.log('✅ Imóvel encontrado por Codigo:', imovel.Codigo);
    } else {
      // Segundo: se não encontrou e parece ser ObjectId, tentar por _id
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('🔍 Tentando busca por _id MongoDB...');
        imovel = await Imovel.findById(id);
        
        if (imovel) {
          console.log('✅ Imóvel encontrado por _id:', imovel._id);
        }
      }
    }

    if (!imovel) {
      console.error('❌ Imóvel não encontrado com ID:', id);
      console.groupEnd();
      return NextResponse.json(
        { status: 404, message: "Imóvel não encontrado", error: "Imóvel não encontrado" },
        { status: 404 }
      );
    }

    console.log('📋 Imóvel localizado:', {
      codigo: imovel.Codigo,
      _id: imovel._id,
      empreendimento: imovel.Empreendimento,
      versaoAtual: imovel.__v
    });

    // 🔥 PROCESSAMENTO ESPECIAL PARA FOTOS (CRÍTICO PARA ORDENAÇÃO)
    if (dadosAtualizados.Foto) {
      console.log('📸 Processando fotos...');
      
      let fotosProcessadas = [];
      
      if (Array.isArray(dadosAtualizados.Foto)) {
        console.log('📸 Fotos em formato array:', dadosAtualizados.Foto.length);
        
        // Verificar se tem ordem manual
        const temOrdemManual = dadosAtualizados.Foto.every(foto => 
          typeof foto.ordem === 'number' && foto.ordem >= 0
        );
        
        console.log('📸 Tem ordem manual?', temOrdemManual);
        
        // Processar cada foto individualmente
        fotosProcessadas = dadosAtualizados.Foto.map((foto, index) => {
          // Garantir que ordem seja número válido
          const ordemFinal = typeof foto.ordem === 'number' ? foto.ordem : index;
          
          // Criar objeto limpo da foto
          const fotoProcessada = {
            Codigo: foto.Codigo || `photo-${Date.now()}-${index}`,
            Foto: foto.Foto || '',
            Destaque: foto.Destaque || "Nao",
            ordem: ordemFinal
          };
          
          // Preservar outros campos se existirem
          if (foto._id) fotoProcessada._id = foto._id;
          if (foto.Ordem) fotoProcessada.Ordem = foto.Ordem;
          if (foto.ORDEM) fotoProcessada.ORDEM = foto.ORDEM;
          if (foto.Descricao) fotoProcessada.Descricao = foto.Descricao;
          if (foto.Alt) fotoProcessada.Alt = foto.Alt;
          
          // Remover campos undefined/null/vazios
          Object.keys(fotoProcessada).forEach(key => {
            if (fotoProcessada[key] === undefined || 
                fotoProcessada[key] === null || 
                fotoProcessada[key] === '') {
              delete fotoProcessada[key];
            }
          });
          
          return fotoProcessada;
        });
        
        // Ordenar por campo ordem para garantir consistência
        fotosProcessadas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        
        console.log('📸 Fotos processadas:', {
          total: fotosProcessadas.length,
          ordens: fotosProcessadas.map(f => f.ordem),
          primeirasFotos: fotosProcessadas.slice(0, 3).map(f => ({ 
            codigo: f.Codigo, 
            ordem: f.ordem,
            destaque: f.Destaque,
            url: f.Foto?.substring(f.Foto.lastIndexOf('/') + 1, f.Foto.lastIndexOf('/') + 15) + '...'
          }))
        });
        
      } else if (typeof dadosAtualizados.Foto === 'object') {
        // Converter objeto para array (formato legacy)
        console.log('📸 Convertendo objeto de fotos para array...');
        fotosProcessadas = Object.entries(dadosAtualizados.Foto)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([key, foto], index) => ({
            ...foto,
            Codigo: key,
            ordem: foto.ordem !== undefined ? foto.ordem : index
          }));
      }
      
      dadosAtualizados.Foto = fotosProcessadas;
    }

    // 🔥 PROCESSAMENTO DE VÍDEOS (se existir)
    if (dadosAtualizados.Video) {
      console.log('🎥 Processando vídeos...');
      
      let videosProcessados = [];
      
      if (Array.isArray(dadosAtualizados.Video)) {
        videosProcessados = dadosAtualizados.Video;
      } else if (typeof dadosAtualizados.Video === 'object') {
        videosProcessados = Object.values(dadosAtualizados.Video);
      }
      
      dadosAtualizados.Video = videosProcessados.length > 0 ? videosProcessados : undefined;
      console.log('🎥 Vídeos processados:', videosProcessados.length);
    }

    // 🔥 LIMPEZA GERAL DOS DADOS
    console.log('🧹 Limpando dados para atualização...');
    
    // Remover campos que podem causar conflito ou são desnecessários
    const camposParaRemover = ['_id', '__v', 'createdAt', 'updatedAt'];
    camposParaRemover.forEach(campo => {
      if (dadosAtualizados[campo]) {
        delete dadosAtualizados[campo];
      }
    });

    // 📝 ATUALIZAÇÃO DO DOCUMENTO
    console.log('📝 Atualizando campos do documento...');
    
    // Atualizar cada campo individualmente
    Object.keys(dadosAtualizados).forEach(key => {
      if (dadosAtualizados[key] !== undefined) {
        imovel[key] = dadosAtualizados[key];
        console.log(`   ✅ Campo ${key} atualizado`);
      }
    });

    // 🔥 MARCAR CAMPOS MODIFICADOS (CRÍTICO PARA ARRAYS)
    const camposArray = ['Foto', 'Video'];
    camposArray.forEach(campo => {
      if (dadosAtualizados[campo]) {
        imovel.markModified(campo);
        console.log(`🔄 Campo ${campo} marcado como modificado`);
      }
    });

    // 💾 SALVAMENTO NO MONGODB
    console.log('💾 Salvando documento no MongoDB...');
    
    try {
      const imovelAtualizado = await imovel.save({ 
        validateBeforeSave: false,
        // Não forçar timestamps para evitar conflitos
      });

      console.log('✅ Documento salvo com sucesso!');
      console.log('📊 Resultado do salvamento:', {
        _id: imovelAtualizado._id,
        codigo: imovelAtualizado.Codigo,
        versaoFinal: imovelAtualizado.__v,
        totalFotos: Array.isArray(imovelAtualizado.Foto) ? imovelAtualizado.Foto.length : 0
      });

      // 📸 LOG FINAL DAS FOTOS (para debug)
      if (Array.isArray(imovelAtualizado.Foto) && imovelAtualizado.Foto.length > 0) {
        console.log('📸 Fotos salvas no banco:', {
          total: imovelAtualizado.Foto.length,
          primeirasFotosOrdem: imovelAtualizado.Foto.slice(0, 5).map((f, i) => ({
            posicao: i + 1,
            codigo: f.Codigo,
            ordem: f.ordem,
            destaque: f.Destaque
          }))
        });
      }

      console.groupEnd();

      // 🎉 RESPOSTA DE SUCESSO
      return NextResponse.json({
        status: 200,
        success: true,
        message: "Imóvel atualizado com sucesso",
        data: {
          _id: imovelAtualizado._id,
          Codigo: imovelAtualizado.Codigo,
          Empreendimento: imovelAtualizado.Empreendimento,
          totalFotos: Array.isArray(imovelAtualizado.Foto) ? imovelAtualizado.Foto.length : 0,
          totalVideos: Array.isArray(imovelAtualizado.Video) ? imovelAtualizado.Video.length : 0,
          versao: imovelAtualizado.__v,
          ultimaAtualizacao: new Date().toISOString()
        },
      });

    } catch (saveError) {
      console.error('❌ Erro ao salvar no MongoDB:', saveError);
      console.groupEnd();
      
      // Tratamento específico para diferentes tipos de erro de salvamento
      if (saveError.code === 11000) {
        return NextResponse.json(
          {
            status: 409,
            success: false,
            message: "Conflito: Imóvel com este código já existe",
            error: "Duplicate key error"
          },
          { status: 409 }
        );
      }
      
      throw saveError; // Re-throw para captura no catch geral
    }

  } catch (error) {
    console.error('❌ PUT - Erro geral:', error);
    console.groupEnd();
    
    // 🔥 TRATAMENTO ABRANGENTE DE ERROS
    
    // Erro de cast (ID inválido)
    if (error.name === 'CastError') {
      return NextResponse.json(
        {
          status: 400,
          success: false,
          message: "ID do imóvel inválido",
          error: `Formato de ID inválido: ${id}`
        },
        { status: 400 }
      );
    }
    
    // Erro de validação
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        {
          status: 400,
          success: false,
          message: "Dados inválidos",
          error: validationErrors.join(', ')
        },
        { status: 400 }
      );
    }
    
    // Erro de versão/concorrência
    if (error.name === 'VersionError' || 
        error.message.includes('version') || 
        error.message.includes('__v')) {
      return NextResponse.json(
        {
          status: 409,
          success: false,
          message: "Conflito de versão. O documento foi modificado por outra operação simultaneamente. Recarregue a página e tente novamente.",
          error: "Conflict error"
        },
        { status: 409 }
      );
    }
    
    // Erro de conexão MongoDB
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return NextResponse.json(
        {
          status: 503,
          success: false,
          message: "Erro temporário no banco de dados. Tente novamente em alguns segundos.",
          error: "Database error"
        },
        { status: 503 }
      );
    }
    
    // Erro genérico (fallback)
    return NextResponse.json(
      {
        status: 500,
        success: false,
        message: "Erro interno do servidor",
        error: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
