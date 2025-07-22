// ImagesSection.jsx - MODO INTELIGENTE COM AJUSTES MANUAIS
"use client";

import { memo, useState, useMemo, useEffect } from "react";
import FormSection from "../FormSection";
import Image from "next/image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { photoSorter } from "@/app/utils/photoSorter";

const ImagesSection = memo(({
  formData,
  addSingleImage,
  showImageModal,
  updateImage,
  removeImage,
  removeAllImages,
  setImageAsHighlight,
  changeImagePosition,
  validation
}) => {
  const [downloadingPhotos, setDownloadingPhotos] = useState(false);
  const [forceReorder, setForceReorder] = useState(0);

  // 🎯 ORDENAÇÃO INTELIGENTE SIMPLIFICADA
  const sortedPhotos = useMemo(() => {
    if (!Array.isArray(formData?.Foto) || formData.Foto.length === 0) {
      return [];
    }

    try {
      console.log('📝 ADMIN: Iniciando ordenação inteligente...', {
        totalFotos: formData.Foto.length,
        forceReorder,
        timestamp: new Date().toISOString()
      });
      
      // 🎯 PRESERVAR CÓDIGOS ORIGINAIS antes do photoSorter
      const fotosComCodigosOriginais = formData.Foto.map((foto, index) => ({
        ...foto,
        codigoOriginal: foto.Codigo || foto.codigo || `temp-${Date.now()}-${index}`
      }));
      
      // Limpar campos de ordem para forçar análise inteligente
      const fotosTemp = fotosComCodigosOriginais.map(foto => {
        const { Ordem, ordem, ORDEM, codigoOriginal, ...fotoLimpa } = foto;
        return { ...fotoLimpa, codigoOriginal };
      });
      
      // USAR photoSorter
      const fotosOrdenadas = photoSorter.ordenarFotos(fotosTemp, formData.Codigo || 'temp');
      
      // RESTAURAR CÓDIGOS ORIGINAIS
      const resultado = fotosOrdenadas.map((foto) => ({
        ...foto,
        Codigo: foto.codigoOriginal,
        codigoOriginal: undefined
      }));

      console.log('✅ ADMIN: Ordenação inteligente concluída:', {
        totalFotos: resultado.length,
        destaque: resultado.find(f => f.Destaque === "Sim")?.Codigo,
        primeiras3: resultado.slice(0, 3).map((f, i) => ({
          posicao: i + 1,
          codigo: f.Codigo
        }))
      });

      return resultado;

    } catch (error) {
      console.error('❌ ADMIN: Erro na ordenação:', error);
      return [...formData.Foto];
    }
  }, [formData?.Foto, formData?.Codigo, forceReorder]);

  // Detectar mudanças nas fotos
  useEffect(() => {
    if (formData?.Foto?.length > 0) {
      console.log('📝 ADMIN: Detectada mudança nas fotos, reprocessando...');
      setForceReorder(prev => prev + 1);
    }
  }, [formData?.Foto?.length]);

  const baixarTodasImagens = async (imagens = []) => {
    if (!Array.isArray(imagens)) return;

    setDownloadingPhotos(true);
    const zip = new JSZip();
    const pasta = zip.folder("imagens");

    for (const [i, img] of imagens.entries()) {
      try {
        const cleanUrl = (() => {
          try {
            const parsed = new URL(img.Foto);
            if (parsed.pathname.startsWith("/_next/image")) {
              const inner = parsed.searchParams.get("url");
              return decodeURIComponent(inner || img.Foto);
            }
            return img.Foto;
          } catch {
            return img.Foto;
          }
        })();

        const response = await fetch(cleanUrl);
        if (!response.ok) continue;

        const blob = await response.blob();
        const nome = `imagem-${i + 1}.jpg`;
        pasta?.file(nome, blob);
      } catch (err) {
        console.error(`Erro ao baixar imagem ${i + 1}:`, err);
      }
    }

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "imagens.zip");
    } catch (zipError) {
      console.error("Erro ao gerar zip:", zipError);
    }

    setDownloadingPhotos(false);
  };

  const handleAddImageUrl = async () => {
    try {
      const imageUrl = prompt("Digite a URL da imagem:");
      if (imageUrl?.trim()) {
        console.log('📝 ADMIN: Adicionando imagem via URL:', imageUrl.trim());
        
        try {
          new URL(imageUrl.trim());
          await addSingleImage(imageUrl.trim());
          
          // Sempre reprocessar em modo inteligente
          setTimeout(() => {
            console.log('🔄 ADMIN: Reprocessando após nova imagem...');
            photoSorter.limparCache();
            setForceReorder(prev => prev + 1);
          }, 100);
          
          console.log('✅ ADMIN: Imagem via URL adicionada');
        } catch (urlError) {
          alert('URL inválida. Por favor, digite uma URL válida.');
          console.error('❌ ADMIN: URL inválida:', urlError);
        }
      }
    } catch (error) {
      console.error('❌ ADMIN: Erro ao adicionar imagem via URL:', error);
      alert('Erro ao adicionar imagem. Tente novamente.');
    }
  };

  const handleImageUpload = (codigo) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          updateImage(codigo, e.target.result);
          
          setTimeout(() => {
            photoSorter.limparCache();
            setForceReorder(prev => prev + 1);
          }, 100);
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  // 🔥 MUDANÇA DE POSIÇÃO SIMPLIFICADA
  const handlePositionChange = (codigo, newPosition) => {
    try {
      const position = parseInt(newPosition);
      const posicaoAtual = sortedPhotos.findIndex(p => p.Codigo === codigo) + 1;
      
      console.log('📝 ADMIN: Tentando alterar posição:', { 
        codigo, 
        posicaoAtual,
        novaPosicao: position,
        totalFotos: sortedPhotos.length,
        funcaoDisponivel: typeof changeImagePosition
      });
      
      if (!isNaN(position) && position > 0 && position <= sortedPhotos.length && position !== posicaoAtual) {
        console.log('🔧 EXECUTANDO MUDANÇA DE POSIÇÃO...');
        
        // Chamar função simples primeiro - sem parâmetros extras
        const resultado = changeImagePosition(codigo, position);
        
        console.log('📝 ADMIN: Resultado da mudança:', resultado);
        console.log('✅ ADMIN: Comando de alteração enviado');
        
        // Não forçar reordenação imediatamente - deixar a mudança acontecer primeiro
        // setTimeout(() => {
        //   console.log('🔄 ADMIN: Aplicando ajuste após mudança...');
        //   setForceReorder(prev => prev + 1);
        // }, 500);
        
      } else {
        console.warn('⚠️ ADMIN: Mudança ignorada:', {
          positionInvalid: isNaN(position),
          outOfRange: position <= 0 || position > sortedPhotos.length,
          samePosition: position === posicaoAtual
        });
      }
    } catch (error) {
      console.error('❌ ADMIN: Erro ao alterar posição:', error);
      alert('Erro ao alterar posição. Tente novamente.');
    }
  };

  const handleRemoveImage = (codigo) => {
    try {
      console.log('📝 ADMIN: Removendo imagem:', codigo);
      removeImage(codigo);
      
      setTimeout(() => {
        photoSorter.limparCache();
        setForceReorder(prev => prev + 1);
      }, 100);
      
      console.log('✅ ADMIN: Imagem removida');
    } catch (error) {
      console.error('❌ ADMIN: Erro ao remover imagem:', error);
      alert('Erro ao remover imagem. Tente novamente.');
    }
  };

  const handleReprocessOrder = () => {
    console.log('🔄 ADMIN: Reprocessando ordenação inteligente...');
    try {
      photoSorter.limparCache();
      setForceReorder(prev => prev + 1);
      console.log('✅ ADMIN: Reprocessamento solicitado');
    } catch (error) {
      console.error('❌ ADMIN: Erro ao reprocessar:', error);
    }
  };

  const handleSetAsHighlight = (codigo) => {
    try {
      console.log('📝 ADMIN: Definindo como destaque:', codigo);
      setImageAsHighlight(codigo);
      
      setTimeout(() => {
        photoSorter.limparCache();
        setForceReorder(prev => prev + 1);
      }, 100);
      
      console.log('✅ ADMIN: Destaque definido');
    } catch (error) {
      console.error('❌ ADMIN: Erro ao definir destaque:', error);
    }
  };

  return (
    <FormSection title="Imagens do Imóvel" className="mb-8">
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="text-sm">
            <span className="font-medium text-gray-700">
              {validation.photoCount}/{validation.requiredPhotoCount} fotos
            </span>
            {validation.photoCount < validation.requiredPhotoCount && (
              <span className="text-red-500 ml-2">
                (Mínimo {validation.requiredPhotoCount})
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              title="Adicionar imagem via URL"
            >
              + Adicionar URL
            </button>
            
            <button
              type="button"
              onClick={showImageModal}
              className="px-3 py-1.5 text-sm bg-black hover:bg-gray-800 text-white rounded-md transition-colors"
            >
              📤 Upload em Lote
            </button>

            {sortedPhotos.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleReprocessOrder}
                  className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                  title="Reprocessar ordenação inteligente"
                >
                  🔄 Reordenar
                </button>
                
                <button
                  type="button"
                  onClick={() => baixarTodasImagens(sortedPhotos)}
                  disabled={downloadingPhotos}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    downloadingPhotos
                      ? 'bg-blue-300 text-white cursor-wait'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {downloadingPhotos ? 'Baixando...' : '⬇️ Baixar Todas'}
                </button>
                
                <button
                  type="button"
                  onClick={removeAllImages}
                  className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  title="Remover todas as imagens"
                >
                  🗑️ Limpar Tudo
                </button>
              </>
            )}
          </div>
        </div>

        {/* INDICADOR SIMPLIFICADO - SEMPRE INTELIGENTE */}
        <div className="p-3 rounded-md text-sm border-l-4 bg-green-50 border-green-400 text-green-700">
          <p>
            <strong>🤖 ORDEM INTELIGENTE SEMPRE ATIVA</strong>
            <span className="text-xs ml-2 text-green-600">
              (Reorder #{forceReorder})
            </span>
          </p>
          <p className="text-xs mt-1">
            📸 PhotoSorter organizando automaticamente. Você pode ajustar posições específicas usando os selects. Destaque sempre em 1º.
          </p>
        </div>

        {sortedPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPhotos.map((photo, index) => (
              <div key={`${photo.Codigo}-${index}-${forceReorder}`} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="relative aspect-video w-full">
                  <Image
                    src={photo.Foto}
                    alt={`Imóvel ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {photo.Destaque === "Sim" && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                      DESTAQUE
                    </span>
                  )}
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}°
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        Posição
                      </label>
                      <select
                        value={index + 1}
                        onChange={(e) => handlePositionChange(photo.Codigo, e.target.value)}
                        className="w-full p-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        title={`Mover para posição (Código: ${photo.Codigo})`}
                      >
                        {[...Array(sortedPhotos.length)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}°
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Destaque</label>
                      <button
                        onClick={() => handleSetAsHighlight(photo.Codigo)}
                        className={`w-full p-1.5 text-sm rounded-md transition-colors ${
                          photo.Destaque === "Sim"
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Definir como foto principal"
                      >
                        {photo.Destaque === "Sim" ? "★ Destaque" : "☆ Destacar"}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 truncate" title={`Código: ${photo.Codigo}`}>
                    ID: {photo.Codigo || 'N/A'}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleImageUpload(photo.Codigo)}
                      className="flex-1 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                      title="Substituir esta imagem"
                    >
                      🔄 Trocar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(photo.Codigo)}
                      className="flex-1 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-md transition-colors"
                      title="Remover esta imagem"
                    >
                      ✖ Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500">Nenhuma imagem cadastrada</p>
            <p className="text-sm text-gray-400 mt-1">
              Utilize os botões acima para adicionar imagens
            </p>
          </div>
        )}

        {validation.photoCount < validation.requiredPhotoCount && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
            <p className="text-yellow-700 text-sm">
              ⚠️ Adicione pelo menos {validation.requiredPhotoCount} fotos para publicar
            </p>
          </div>
        )}
      </div>
    </FormSection>
  );
});

ImagesSection.displayName = "ImagesSection";
export default ImagesSection;
