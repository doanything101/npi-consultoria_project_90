"use client";

import { memo, useState, useEffect } from 'react';
import FormSection from '../FormSection';

const MediaSection = ({ formData, displayValues, onChange }) => {
  
  // 🎯 Estados locais sincronizados com formData (evita interferência)
  const [localTour360, setLocalTour360] = useState('');
  const [localVideoId, setLocalVideoId] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFullTourPreview, setShowFullTourPreview] = useState(false); // ✅ NOVO: Controle do preview completo

  // 🔄 Sincronizar com props quando mudarem (mas só uma vez)
  useEffect(() => {
    if (!isInitialized) {
      const tour360Value = displayValues?.Tour360 || formData?.Tour360 || '';
      const videoIdValue = formData?.Video?.["1"]?.Video || '';
      
      setLocalTour360(tour360Value);
      setLocalVideoId(videoIdValue);
      setIsInitialized(true);
      
      console.log('🔄 MediaSection inicializado:', { tour360Value, videoIdValue });
    }
  }, [formData, displayValues, isInitialized]);

  // ✅ NOVA FUNÇÃO: Extrair ID do Matterport
  const extractMatterportId = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    try {
      // Patterns do Matterport
      const patterns = [
        /my\.matterport\.com\/show\/\?m=([^&\n?#]+)/,  // URL padrão
        /matterport\.com\/.*[?&]m=([^&\n?#]+)/,        // Variações
        /\/show\/\?m=([^&\n?#]+)/                      // Relativo
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          console.log('🏗️ Matterport ID extraído:', match[1]);
          return match[1];
        }
      }
      
      console.log('🏗️ Nenhum pattern do Matterport encontrado em:', url);
      return null;
    } catch (error) {
      console.error('Erro ao extrair ID do Matterport:', error);
      return null;
    }
  };

  // ✅ NOVA FUNÇÃO: Verificar se URL é válida do Matterport
  const isValidMatterportUrl = (url) => {
    return extractMatterportId(url) !== null;
  };

  // 🚀 Handler para Tour 360 - Atualiza local E pai
  const handleTour360Change = (e) => {
    const value = e.target.value;
    
    // 1. Atualização LOCAL imediata (garante responsividade)
    setLocalTour360(value);
    
    // 2. Atualização no COMPONENTE PAI (com debounce/batch)
    if (typeof onChange === 'function') {
      try {
        onChange("Tour360", value);
      } catch (error) {
        console.error('Erro ao atualizar Tour360:', error);
      }
    }
  };

  // ✅ Handler para Video ID completo e funcional
  const handleVideoIdChange = (e) => {
    const value = e.target.value;
    console.log('🎬 handleVideoIdChange chamado:', value);
    
    // Extrator de ID do YouTube (aceita URL ou ID)
    const extractYouTubeId = (input) => {
      if (!input) return '';
      
      console.log('🎬 Extraindo ID de:', input);
      
      // Se não tem youtube.com/youtu.be, assumir que já é ID
      if (!input.includes('youtube.com') && !input.includes('youtu.be')) {
        console.log('🎬 Assumindo que é ID direto:', input);
        return input;
      }
      
      // Extrair ID de URLs
      const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
        /(?:youtu\.be\/)([^&\n?#]+)/,
        /(?:youtube\.com\/embed\/)([^&\n?#]+)/
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          console.log('🎬 ID extraído com pattern:', match[1]);
          return match[1];
        }
      }
      
      console.log('🎬 Nenhum pattern funcionou, usando input original:', input);
      return input;
    };

    const cleanId = extractYouTubeId(value);
    console.log('🎬 ID limpo extraído:', cleanId);
    
    // 1. Atualização LOCAL imediata
    setLocalVideoId(cleanId);
    
    // 2. Atualização no COMPONENTE PAI
    if (typeof onChange === 'function') {
      try {
        const videoData = {
          "1": {
            Video: cleanId
          }
        };
        
        console.log('🎬 MediaSection criando videoData:', videoData);
        console.log('🎬 Chamando onChange com:', "Video", videoData);
        console.log('🎬 onChange é função?', typeof onChange === 'function');
        
        onChange("Video", videoData);
        
        console.log('🎬 onChange executado com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao atualizar Video:', error);
      }
    } else {
      console.error('❌ onChange não é uma função:', typeof onChange);
    }
  };

  // ✅ NOVA VARIÁVEL: ID extraído do Matterport para preview
  const matterportId = extractMatterportId(localTour360);

  return (
    <FormSection title="Mídia">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tour 360° */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link do Tour Virtual 360°
          </label>
          <input
            type="text"
            value={localTour360}
            onChange={handleTour360Change}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       transition-colors"
            placeholder="https://my.matterport.com/show/?m=..."
          />
          
          {/* ✅ NOVO: Thumbnail do Tour 360 (LEVE) */}
          {matterportId && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div className="relative aspect-video w-full max-w-xs group">
                <div 
                  className="relative w-full h-full rounded border overflow-hidden cursor-pointer bg-gray-100"
                  onClick={() => window.open(`https://my.matterport.com/show/?m=${matterportId}`, '_blank')}
                >
                  {/* Thumbnail do Matterport */}
                  <img
                    src={`https://cdn-2.matterport.com/apifs/models/${matterportId}/images/poster.jpg`}
                    alt="Preview do Tour 360°"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback: imagem genérica se não conseguir carregar
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  
                  {/* Fallback: placeholder quando thumbnail não carrega */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white hidden">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🏠</div>
                      <div className="text-sm font-medium">Tour Virtual 360°</div>
                    </div>
                  </div>
                  
                  {/* Overlay com botão play */}
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white bg-opacity-90 rounded-full p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-blue-600">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Badge "360°" */}
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                    360°
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 mt-1">
                  Clique para abrir o tour virtual
                  {!showFullTourPreview && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullTourPreview(true);
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      • Preview completo
                    </button>
                  )}
                </p>
              </div>
              
              {/* Preview completo (apenas se solicitado) */}
              {showFullTourPreview && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">Preview completo:</p>
                    <button
                      type="button"
                      onClick={() => setShowFullTourPreview(false)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      ✕ Fechar
                    </button>
                  </div>
                  <div className="relative aspect-video w-full max-w-sm">
                    <iframe
                      src={`https://my.matterport.com/show/?m=${matterportId}&play=1&qs=1`}
                      className="w-full h-full rounded border"
                      frameBorder="0"
                      allowFullScreen
                      title="Preview completo do Tour 360°"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* ✅ NOVO: Indicador de URL inválida */}
          {localTour360 && localTour360.length > 10 && !matterportId && (
            <div className="mt-2">
              <p className="text-xs text-amber-600">
                ⚠️ URL do Matterport não reconhecida. Verifique o formato.
              </p>
            </div>
          )}
        </div>

        {/* Vídeo YouTube */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID do Vídeo (YouTube)
          </label>
          <input
            type="text"
            value={localVideoId}
            onChange={handleVideoIdChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       transition-colors"
            placeholder="Ex: mdcsckJg7rc ou URL completa"
          />
          
          {/* Preview do vídeo */}
          {localVideoId && localVideoId.length > 5 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div className="relative aspect-video w-full max-w-xs">
                <iframe
                  src={`https://www.youtube.com/embed/${localVideoId}`}
                  className="w-full h-full rounded border"
                  frameBorder="0"
                  allowFullScreen
                  title="Preview do YouTube"
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Dica atualizada */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-700">
          💡 <strong>Dica:</strong> Para o vídeo do YouTube, você pode colar a URL completa ou apenas o ID. 
          Para o Tour 360°, use o link completo do Matterport - será exibido um thumbnail leve para não sobrecarregar a página.
        </p>
      </div>
    </FormSection>
  );
};

export default memo(MediaSection);
