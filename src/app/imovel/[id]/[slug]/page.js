// app/imovel/[id]/[slug]/page.js

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

// ✅ SEO DINÂMICO
export async function generateMetadata({ params }) {
  const { id } = params;
  
  console.error(`[IMOVEL-META] =========== PROCESSANDO ID: ${id} ===========`);
  
  const response = await getImovelById(id);

  if (!response?.data) return {};

  const imovel = response.data;
  
  // ✅ FUNÇÃO PARA CONVERTER DATA BRASILEIRA PARA ISO
  const convertBrazilianDateToISO = (brazilianDate) => {
    if (!brazilianDate) return null;
    
    try {
      // "26/06/2025, 17:12:39" -> "2025-06-26T17:12:39Z"
      const [datePart, timePart] = brazilianDate.split(', ');
      const [day, month, year] = datePart.split('/');
      const [hours, minutes, seconds] = timePart.split(':');
      
      // Criar objeto Date e converter para ISO
      const date = new Date(year, month - 1, day, hours, minutes, seconds);
      return date.toISOString();
    } catch (error) {
      console.error('Erro ao converter data:', error);
      return null;
    }
  };
  
  const title = `${imovel.Empreendimento} - ${imovel.BairroComercial}, ${imovel.Cidade}`;
  const description = `${imovel.Categoria} à venda no bairro ${imovel.BairroComercial}, ${imovel.Cidade}. ${imovel.DormitoriosAntigo} dormitórios, ${imovel.SuiteAntigo} suítes, ${imovel.VagasAntigo} vagas, ${imovel.MetragemAnt}. Valor: ${imovel.ValorAntigo ? `R$ ${imovel.ValorAntigo}` : "Consulte"}.`;

  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/imovel-${imovel.Codigo}/${imovel.Slug}`;
  
  const imageUrl = Array.isArray(imovel.Foto) && imovel.Foto.length > 0 
    ? (imovel.Foto[0].Foto || imovel.Foto[0].FotoPequena || imovel.Foto[0])
    : imovel.Foto || `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`;

  console.error(`[IMOVEL-META] Image URL: ${imageUrl}`);
  
  // ✅ CONVERTER DATA PARA ISO
  const modifiedDate = convertBrazilianDateToISO(imovel.DataHoraAtualizacao);
  console.error(`[IMOVEL-META] Data original: ${imovel.DataHoraAtualizacao}`);
  console.error(`[IMOVEL-META] Data convertida: ${modifiedDate}`);

  return {
    title,
    description,
    alternates: {
      canonical: currentUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: currentUrl,
      type: "website",
      siteName: "NPI Consultoria",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/jpeg",
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@NPIImoveis",
      creator: "@NPIImoveis",
      images: [
        {
          url: imageUrl,
          alt: title,
        }
      ],
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL),
    alternates: {
      canonical: currentUrl,
      languages: {
        "pt-BR": currentUrl,
      },
    },
    // ✅ Data de atualização para SEO - COM CONVERSÃO
    other: {
      ...(modifiedDate && {
        other: {
  'article:modified_time': '2025-01-10T14:30:00Z', // Data fixa para teste
},
      }),
    },
  };
}
export const revalidate = 0;

export default async function Imovel({ params }) {
  const { id, slug } = params;
  
  console.log(`🏠 [IMOVEL-PAGE] =================== INÍCIO ===================`);
  console.log(`🏠 [IMOVEL-PAGE] Processando ID: ${id}, SLUG: ${slug}`);
  console.log(`🏠 [IMOVEL-PAGE] Params completos:`, params);
  
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
    redirect(`/imovel-${id}/${slugCorreto}`);
  }  

  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/imovel-${imovel.Codigo}/${imovel.Slug}`;

  return (
    <section className="w-full bg-white pb-32 pt-20">
      <StructuredDataApartment
        title={imovel.Empreendimento}
        price={imovel.ValorAntigo ? `R$ ${imovel.ValorAntigo}` : "Consulte"}
        description={`${imovel.Categoria} à venda em ${imovel.BairroComercial}, ${imovel.Cidade}. ${imovel.Empreendimento}: ${imovel.DormitoriosAntigo} quartos, ${imovel.SuiteAntigo} suítes, ${imovel.BanheiroSocialQtd} banheiros, ${imovel.VagasAntigo} vagas, ${imovel.MetragemAnt}. ${imovel.Situacao}. Valor: ${imovel.ValorAntigo ? `R$ ${imovel.ValorAntigo}` : "Consulte"}. ${imovel.TipoEndereco} ${imovel.Endereco}.`}
        address={`${imovel.TipoEndereco} ${imovel.Endereco}, ${imovel.Numero}, ${imovel.BairroComercial}, ${imovel.Cidade}`}
        url={currentUrl}
        image={imovel.Foto}
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
          {imovel.Video && Object.keys(imovel.Video).length > 0 && (
            <VideoCondominio imovel={imovel} />
          )}
          {imovel.Tour360 && <TourVirtual link={imovel.Tour360} titulo={imovel.Empreendimento} />}
          <SimilarProperties id={imovel.Codigo} />
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
}
