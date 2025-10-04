import { Oxanium, Michroma } from "next/font/google";
import "./globals.css";
import QueryProvider from "./providers/QueryClientProvider";
import { MusicPlayer } from "./components/shared/music-player";
import { Organization, WebSite } from "./components/structured-data";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

// ✅ CORREÇÃO: Fontes sem preload (evita warnings)
const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  // preload: true, // ❌ REMOVIDO: Causa warnings
});

const michroma = Michroma({
  variable: "--font-michroma",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  // preload: true, // ❌ REMOVIDO: Causa warnings
});

const GTM_ID = "GTM-NN6HZC";
const ANALYTICS_ID = "G-405E52JFGM";

// METADATA SEM MANIFEST - Evita erros
export const metadata = {
  title: {
    default: "NPi Consultoria - Imóveis de Alto Padrão",
    template: "%s | NPi"
  },
  description: "Especialistas em imóveis de alto padrão. Encontre apartamentos, casas e terrenos exclusivos com a melhor consultoria imobiliária.",
  keywords: ["imóveis alto padrão", "consultoria imobiliária", "apartamentos luxo", "casas exclusivas"],
  authors: [{ name: "NPi Consultoria" }],
  creator: "NPi Consultoria",
  publisher: "NPi Consultoria",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://www.npiconsultoria.com.br",
    languages: {
      "pt-BR": process.env.NEXT_PUBLIC_SITE_URL || "https://www.npiconsultoria.com.br",
    },
  },
  // OpenGraph SEM imagens específicas - deixa o sistema usar as imagens das páginas
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.npiconsultoria.com.br",
    siteName: "NPi Consultoria",
    title: "NPi Consultoria - Imóveis de Alto Padrão",
    description: "Especialistas em imóveis de alto padrão com a melhor consultoria imobiliária.",
    // REMOVIDO: images array para não interferir nas fotos de condomínio
  },
  twitter: {
    card: "summary_large_image",
    title: "NPi Consultoria - Imóveis de Alto Padrão",
    description: "Especialistas em imóveis de alto padrão com a melhor consultoria imobiliária.",
    // REMOVIDO: images para não interferir
  },
  // ✅ CORREÇÃO: Manifest completamente removido
  // manifest: "/manifest.json", // ❌ REMOVIDO: Evita erros
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NPi Consultoria",
  },
};

// 🔧 ACESSIBILIDADE CORRIGIDA: Viewport permite zoom geral, CSS específico bloqueia search
export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  // ✅ CORREÇÃO CIRÚRGICA: Remove restrições globais de zoom (acessibilidade)
  // maximumScale: 1.0,     // ❌ REMOVIDO: Bloqueava zoom globalmente  
  // minimumScale: 1.0,     // ❌ REMOVIDO: Bloqueava zoom globalmente
  // userScalable: false,   // ❌ REMOVIDO: Bloqueava zoom globalmente
  // ✅ MANTIDO: Configurações iOS específicas que não afetam acessibilidade
  viewportFit: "cover",
  shrinkToFit: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* 🔧 ACESSIBILIDADE CORRIGIDA: Meta viewport permite zoom geral */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        
        {/* ✅ iOS específico: Safari + Chrome iOS (CORRIGIDO) */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NPi Consultoria" />
        
        {/* Meta tags essenciais SEM interferir em imagens (MANTIDO) */}
        <meta name="format-detection" content="telephone=no, email=no, address=no" />
        
        {/* ✅ Theme e color scheme para consistência iOS (MANTIDO) */}
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light" />
        
        {/* ✅ OTIMIZAÇÃO: DNS prefetch apenas essencial */}
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Preconnect essenciais SEM preload de mídia (MANTIDO) */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* ✅ CORREÇÃO: Manifest link completamente removido */}
        {/* <link rel="manifest" href="/manifest.json" /> */}
        
        {/* Favicon otimizado (MANTIDO) */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* ✅ CSS CIRÚRGICO: MANTÉM toda funcionalidade iOS + adiciona seletores específicos para search */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* ✅ MANTIDO: Chrome iOS detection para SEARCH ESPECÍFICO */
            @supports (-webkit-appearance: none) and (not (-webkit-backdrop-filter: blur(1px))) {
              
              /* 🎯 CIRÚRGICO: Aplica apenas em campos de BUSCA/SEARCH (não todos inputs) */
              input[type="search"],
              input[placeholder*="Buscar"],
              input[placeholder*="buscar"], 
              input[placeholder*="Pesquisar"],
              input[placeholder*="pesquisar"],
              input[placeholder*="Procurar"],
              input[placeholder*="procurar"],
              .search-input,
              [data-search="true"] input,
              form[role="search"] input {
                font-size: 16px !important;
                -webkit-user-scalable: 0 !important;
                user-scalable: 0 !important;
                -webkit-text-size-adjust: none !important;
                -webkit-transform: translate3d(0,0,0) !important;
                transform: translate3d(0,0,0) !important;
              }
              
              /* 🎯 CIRÚRGICO: Placeholder pequeno apenas para SEARCH */
              input[type="search"]::placeholder,
              input[placeholder*="Buscar"]::placeholder,
              input[placeholder*="buscar"]::placeholder,
              input[placeholder*="Pesquisar"]::placeholder,
              input[placeholder*="pesquisar"]::placeholder,
              .search-input::placeholder,
              [data-search="true"] input::placeholder,
              form[role="search"] input::placeholder {
                font-size: 11px !important;
                opacity: 0.7 !important;
              }
              
              /* ✅ OUTROS INPUTS: Comportamento normal (acessível) */
              input:not([type="search"]):not([placeholder*="Buscar"]):not([placeholder*="buscar"]):not(.search-input),
              textarea:not(.search-input) {
                /* Permite zoom em formulários normais (acessibilidade) */
                font-size: 12px;
                /* Remove restrições de zoom para campos normais */
              }
            }
            
            /* ✅ MANTIDO: Propriedades básicas para iOS mobile */
            @media screen and (max-width: 768px) {
              /* Aplica apenas em campos de busca */
              input[type="search"],
              input[placeholder*="Buscar"],
              input[placeholder*="buscar"],
              .search-input {
                -webkit-user-scalable: 0 !important;
                user-scalable: 0 !important;
                min-height: 40px !important;
              }
              
              /* Placeholder responsivo apenas para search */
              input[type="search"]::placeholder,
              input[placeholder*="Buscar"]::placeholder,
              .search-input::placeholder {
                font-size: 11px !important;
              }
            }
            
            @media screen and (min-width: 768px) {
              input::placeholder {
                font-size: 14px !important;
              }
            }
            
            /* ✅ MANTIDO: Propriedades gerais */
            * {
              -webkit-tap-highlight-color: transparent !important;
            }
            
            html {
              -webkit-text-size-adjust: 100% !important;
            }
          `
        }} />
      </head>
      
      <body 
        className={`${oxanium.variable} ${michroma.variable} antialiased`}
        style={{
          // ✅ MANTIDO: Todas as propriedades originais
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          WebkitTapHighlightColor: "transparent",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          // ✅ CORREÇÃO: Remove text-size-adjust do body (problema admin)
          // WebkitTextSizeAdjust: "100%",  // ❌ REMOVIDO: Afetava admin
          // textSizeAdjust: "100%",        // ❌ REMOVIDO: Afetava admin
          touchAction: "manipulation",
        }}
      >
        {/* ✅ MANTIDO: GTM Script com priority */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          priority
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `,
          }}
        />

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`}
          strategy="afterInteractive"
        />
        <Script 
          id="gtag-init" 
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ANALYTICS_ID}', {
                page_title: document.title,
                page_location: window.location.href,
                anonymize_ip: true,
              });
            `,
          }}
        />

        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* ✅ MANTIDO: Structured data otimizado */}
        <Organization />
        <WebSite />
        
        {/* ✅ MANTIDO: Query provider com error boundary */}
        <QueryProvider>
          {children}
        </QueryProvider>
        
        {/* ✅ MANTIDO: Components com lazy loading */}
        <MusicPlayer />
        
        {/* ✅ MANTIDO: Analytics otimizados */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
