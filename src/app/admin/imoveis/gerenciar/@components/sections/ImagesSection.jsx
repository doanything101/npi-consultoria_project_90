
// ---------------------------------------------------------
// ImagesSection.jsx (ADMIN)
// ---------------------------------------------------------

"use client";

import { memo, useState } from "react";
import FormSection from "../FormSection";
import Image from "next/image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const ImagesSection = memo(({
  formData,
  addSingleImage,
  showImageModal,
  updateImage,
  removeImage,
  removeAllImages,
  setImageAsHighlight,
  changeImagePosition,
  validation,
}) => {
  const [downloadingPhotos, setDownloadingPhotos] = useState(false);

  // Processamento das fotos com destaque primeiro
  const sortedPhotos = Array.isArray(formData?.Foto)
    ? (() => {
        console.log('🔍 ADMIN - DEBUG: Fonte dos dados:', {
          totalFotos: formData.Foto.length,
          tipoArray: Array.isArray(formData.Foto),
          primeiraFoto: formData.Foto[0]
        });

        const ordemOriginal = [...formData.Foto];
        console.log('============================================================');
        console.log('⚙️ ADMIN - Total de fotos:', ordemOriginal.length);
        console.log('⚙️ ADMIN - Códigos na ordem original:', ordemOriginal.map(f => f.Codigo));
        console.log('⚙️ ADMIN - Destaques na ordem original:', ordemOriginal.map(f => f.Destaque));
        console.log('⚙️ ADMIN - Primeira foto original:', ordemOriginal[0]?.Codigo);
        console.log('⚙️ ADMIN - URLs das primeiras 5 fotos:', ordemOriginal.slice(0, 5).map(f => f.Foto?.substring(0, 60)));
        
        // 🔍 DEBUG ADICIONAL - Estrutura completa das primeiras 3 fotos
        console.log('🔍 ADMIN - DEBUG: Estrutura das primeiras 3 fotos:');
        ordemOriginal.slice(0, 3).forEach((foto, index) => {
          console.log(`  Foto ${index + 1}:`, {
            Codigo: foto.Codigo,
            Destaque: foto.Destaque,
            Foto: foto.Foto?.substring(0, 80),
            todasAsPropriedades: Object.keys(foto)
          });
        });

        // Encontrar índice do destaque
        const destaqueIndex = ordemOriginal.findIndex(f => f.Destaque === "Sim");
        
        if (destaqueIndex === -1) {
          console.log('⚙️ ADMIN - ❌ Sem destaque encontrado, mantendo ordem original');
          console.log('⚙️ ADMIN - Primeira foto sem destaque:', ordemOriginal[0]?.Codigo);
          console.log('⚙️ ADMIN - Códigos na ordem final:', ordemOriginal.map(f => f.Codigo));
          
          // 🔍 VERIFICAR SE OS CÓDIGOS ESTÃO DIFERENTES
          const codigosUnicos = [...new Set(ordemOriginal.map(f => f.Codigo))];
          console.log('🔍 ADMIN - Total de códigos únicos:', codigosUnicos.length);
          console.log('🔍 ADMIN - Códigos únicos:', codigosUnicos.slice(0, 10));
          
          console.log('============================================================');
          return ordemOriginal;
        }

        console.log('⚙️ ADMIN - ✅ Destaque encontrado na posição:', destaqueIndex + 1, 'Código:', ordemOriginal[destaqueIndex].Codigo);

        // Destaque primeiro + demais na ordem original (exceto destaque)
        const fotoDestaque = ordemOriginal[destaqueIndex];
        const outrasfotos = ordemOriginal.filter((_, index) => index !== destaqueIndex);
        const ordemFinal = [fotoDestaque, ...outrasfotos];
        
        console.log('⚙️ ADMIN - ✅ Código da foto destaque:', fotoDestaque.Codigo);
        console.log('⚙️ ADMIN - Códigos na ordem final:', ordemFinal.map(f => f.Codigo));
        console.log('⚙️ ADMIN - URLs das primeiras 5 fotos finais:', ordemFinal.slice(0, 5).map(f => f.Foto?.substring(0, 60)));
        console.log('⚙️ ADMIN - 🖼️ PRIMEIRA FOTO sendo exibida:', ordemFinal[0].Codigo);
        
        // 🔍 VERIFICAR SE OS CÓDIGOS ESTÃO DIFERENTES
        const codigosUnicos = [...new Set(ordemFinal.map(f => f.Codigo))];
        console.log('🔍 ADMIN - Total de códigos únicos:', codigosUnicos.length);
        console.log('🔍 ADMIN - Códigos únicos:', codigosUnicos.slice(0, 10)); // Primeiros 10 para não poluir
        
        console.log('============================================================');
        
        return ordemFinal;
      })()
    : [];

  const baixarTodasImagens = async (imagens = []) => {
    if (!Array.isArray(imagens) || imagens.length === 0) return;

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
        if (!response.ok) {
          console.warn(`❌ Erro ao baixar imagem ${i + 1}: ${response.status} ${response.statusText}`);
          continue;
        }

        const blob = await response.blob();
        const nome = `imagem-${i + 1}.jpg`;
        pasta?.file(nome, blob);
      } catch (err) {
        console.error(`❌ Erro crítico ao baixar imagem ${i + 1}:`, err);
      }
    }

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "imagens.zip");
      console.log("✅ Download concluído com sucesso.");
    } catch (zipError) {
      console.error("❌ Erro ao gerar zip:", zipError);
    }

    setDownloadingPhotos(false);
  };

  const handleAddImageUrl = () => {
    const imageUrl = prompt("Digite a URL da imagem:");
    if (imageUrl?.trim()) {
      addSingleImage(imageUrl.trim());
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
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const handlePositionChange = (codigo, newPosition) => {
    const position = parseInt(newPosition);
    if (!isNaN(position) && position > 0 && position <= formData.Foto?.length) {
      changeImagePosition(codigo, position);
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
                >
                  🗑️ Limpar Tudo
                </button>
              </>
            )}
          </div>
        </div>

        {sortedPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPhotos.map((photo, index) => (
              <div key={`${photo.Codigo}-${index}`} className="border rounded-lg overflow-hidden bg-white shadow-sm">
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
                </div>

                <div className="p-3 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Ordem</label>
                      <select
                        value={index + 1}
                        onChange={(e) => handlePositionChange(photo.Codigo, e.target.value)}
                        className="w-full p-1.5 text-sm border rounded-md bg-gray-50"
                      >
                        {[...Array(sortedPhotos.length)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Ação</label>
                      <button
                        onClick={() => setImageAsHighlight(photo.Codigo)}
                        className={`w-full p-1.5 text-sm rounded-md transition-colors ${
                          photo.Destaque === "Sim"
                            ? "bg-yellow-500 text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {photo.Destaque === "Sim" ? "★ Destaque" : "☆ Tornar Destaque"}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleImageUpload(photo.Codigo)}
                      className="flex-1 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                    >
                      🔄 Trocar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(photo.Codigo)}
                      className="flex-1 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-md transition-colors"
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
