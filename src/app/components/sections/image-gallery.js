// ImageGallery.jsx - VERSÃO FINAL: Editável + Reagrupamento Genérico
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { formatterSlug } from "@/app/utils/formatter-slug";
import { Share } from "../ui/share";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

export function ImageGallery({ imovel }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const isMobile = useIsMobile();

  // Função para reagrupar fotos por padrão do código (genérica)
  const reagruparFotosPorTipo = (fotos) => {
    if (!Array.isArray(fotos) || fotos.length === 0) return fotos;

    try {
      // 1. Mapear cada foto com seu código e padrão
      const fotosComPadrao = fotos.map((foto, index) => {
        const url = foto.Foto || '';
        const nomeArquivo = url.split('/').pop() || '';
        const codigo = nomeArquivo.replace(/\.(jpg|jpeg|png|gif)$/i, '');
        
        // Extrair padrão genérico (primeiros caracteres até número ou underscore)
        let padrao = '';
        
        // Tentar diferentes padrões comuns
        if (codigo.includes('i268P')) {
          padrao = 'i268P'; // Tipo 1
        } else if (codigo.includes('iUg3s56gtAT3cfaA5U90')) {
          padrao = 'iUg3s56gtAT3cfaA5U90'; // Tipo 2  
        } else if (codigo.includes('iUG8o15s')) {
          padrao = 'iUG8o15s'; // Tipo 3
        } else {
          // Para códigos diferentes, usar os primeiros 5-8 caracteres
          padrao = codigo.substring(0, Math.min(8, codigo.length)).replace(/[0-9]/g, '');
        }
        
        return {
          foto,
          codigo,
          padrao,
          ordemOriginal: index
        };
      });

      // 2. Agrupar por padrão
      const grupos = {};
      fotosComPadrao.forEach(item => {
        if (!grupos[item.padrao]) {
          grupos[item.padrao] = [];
        }
        grupos[item.padrao].push(item);
      });

      // 3. Ordenar dentro de cada grupo pela ordem original
      Object.keys(grupos).forEach(padrao => {
        grupos[padrao].sort((a, b) => a.ordemOriginal - b.ordemOriginal);
      });

      // 4. Definir ordem dos grupos (primeiro que aparece na lista original)
      const ordemGrupos = [];
      fotosComPadrao.forEach(item => {
        if (!ordemGrupos.includes(item.padrao)) {
          ordemGrupos.push(item.padrao);
        }
      });

      // 5. Montar lista reagrupada
      const fotosReagrupadas = [];
      ordemGrupos.forEach(padrao => {
        if (grupos[padrao]) {
          grupos[padrao].forEach(item => {
            fotosReagrupadas.push(item.foto);
          });
        }
      });

      console.log('🔄 Reagrupamento aplicado:', {
        grupos: Object.keys(grupos).map(p => `${p}: ${grupos[p].length} fotos`),
        totalFotos: fotosReagrupadas.length
      });

      return fotosReagrupadas;

    } catch (error) {
      console.error('❌ Erro no reagrupamento:', error);
      return fotos; // Retorna ordem original em caso de erro
    }
  };

  const getProcessedImages = () => {
    if (!Array.isArray(imovel?.Foto)) return [];

    try {
      // 1. Foto destacada (sempre primeiro)
      const fotoDestaque = imovel.Foto.find(foto => foto.Destaque === "Sim");
      
      // 2. Outras fotos (sem destaque)
      const outrasFotos = imovel.Foto.filter(foto => foto !== fotoDestaque);
      
      // 3. Reagrupar outras fotos por tipo (genérico)
      const outrasFotosReagrupadas = reagruparFotosPorTipo(outrasFotos);
      
      // 4. Array final: destaque + reagrupadas
      const fotosOrdenadas = [
        ...(fotoDestaque ? [fotoDestaque] : []),
        ...outrasFotosReagrupadas
      ];

      console.log('✅ Galeria processada:', {
        total: fotosOrdenadas.length,
        destaque: !!fotoDestaque,
        reagrupamento: 'APLICADO - GENÉRICO'
      });

      return fotosOrdenadas.map((foto, index) => ({
        ...foto,
        Codigo: `${imovel.Codigo}-foto-${index}`,
      }));

    } catch (error) {
      console.error('❌ Erro ao processar imagens:', error);
      return [...imovel.Foto].map((foto, index) => ({
        ...foto,
        Codigo: `${imovel.Codigo}-foto-${index}`,
      }));
    }
  };

  const images = getProcessedImages();

  if (!imovel || !imovel.Empreendimento) {
    return null;
  }

  const slug = formatterSlug(imovel.Empreendimento);

  if (images.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 w-full">
        <div className="col-span-1 h-[410px] relative">
          <div className="w-full h-full overflow-hidden bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Imagem não disponível</span>
          </div>
        </div>
      </div>
    );
  }

  const openModal = (index) => {
    setIsModalOpen(true);
    setSelectedIndex(index ?? null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIndex(null);
  };

  const goNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((prev) => (prev + 1) % images.length);
    }
  };

  const goPrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const tituloCompartilhamento = `Confira este imóvel: ${imovel.Empreendimento}`;
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/imovel-${imovel.Codigo}/${slug}`;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 w-full">
        <div className="col-span-1 h-[410px] cursor-pointer relative" onClick={() => openModal()}>
          <div className="w-full h-full overflow-hidden">
            <Image
              src={images[0].Foto}
              alt={imovel.Empreendimento}
              title={imovel.Empreendimento}
              width={800}
              height={600}
              sizes="(max-width: 350px) 100vw, (max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={images[0].blurDataURL || "/placeholder.png"}
              loading="eager"
              priority={true}
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-110"
            />
          </div>

          {isMobile && images.length > 1 && (
            <div className="absolute top-4 right-4 bg-white bg-opacity-80 backdrop-blur-sm text-black px-3 py-1 rounded-full text-sm font-medium">
              {images.length} fotos
            </div>
          )}
        </div>

        {!isMobile && (
          <div className="col-span-1 grid grid-cols-2 grid-rows-2 gap-1 h-[410px]">
            {images.slice(1, 5).map((image, index) => {
              const isLastImage = index === 3;
              return (
                <div
                  key={index}
                  className="relative h-full overflow-hidden cursor-pointer"
                  onClick={() => openModal()}
                >
                  <Image
                    src={image.Foto}
                    alt={`${imovel.Empreendimento} - imagem ${index + 2}`}
                    title={`${imovel.Empreendimento} - imagem ${index + 2}`}
                    width={400}
                    height={300}
                    sizes="25vw"
                    placeholder="blur"
                    blurDataURL={image.blurDataURL || "/placeholder.png"}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                  />
                  {isLastImage && images.length > 5 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center">
                      <button
                        className="border border-white text-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors"
                        aria-label="Ver mais fotos"
                      >
                        Ver mais fotos
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isMobile && images.length > 1 && (
        <div className="mt-4 px-4">
          <button
            onClick={() => openModal()}
            className="w-full py-3 text-center border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            Ver todas as {images.length} fotos
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-auto">
          <div className="flex justify-between gap-4 p-5 pt-28 mt-6 md:mt-0">
            <button onClick={closeModal} aria-label="Fechar galeria">
              <ArrowLeft color="white" size={24} />
            </button>
            <Share
              primary
              url={url}
              title={tituloCompartilhamento}
              imovel={{
                Codigo: imovel.Codigo,
                Empreendimento: imovel.Empreendimento,
              }}
            />
          </div>

          {selectedIndex !== null ? (
            <div className="flex items-center justify-center min-h-screen p-4 relative">
              <Image
                src={images[selectedIndex].Foto}
                alt={`${imovel.Empreendimento} - imagem ampliada`}
                title={`${imovel.Empreendimento} - imagem ampliada`}
                width={1200}
                height={800}
                sizes="100vw"
                placeholder="blur"
                blurDataURL={images[selectedIndex].blurDataURL || "/placeholder.png"}
                loading="eager"
                className="max-w-full max-h-screen object-contain"
              />

              <button
                onClick={goPrev}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white text-4xl px-2"
                aria-label="Imagem anterior"
              >
                &#10094;
              </button>
              <button
                onClick={goNext}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-4xl px-2"
                aria-label="Próxima imagem"
              >
                &#10095;
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 ">
              {images.map((image, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 cursor-pointer overflow-hidden"
                >
                  <Image
                    src={image.Foto}
                    alt={`${imovel.Empreendimento} - imagem ${idx + 1}`}
                    title={`${imovel.Empreendimento} - imagem ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    placeholder="blur"
                    blurDataURL={image.blurDataURL || "/placeholder.png"}
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
