// middleware-seo-optimized.js - SEO FOCUSED MIDDLEWARE

import { NextResponse } from "next/server";

export async function middleware(request) {
  const url = request.nextUrl.clone();
  const { pathname, origin, searchParams } = url;
  const userAgent = request.headers.get('user-agent') || '';

  console.log(`🔍 [SEO-MIDDLEWARE] Processing: ${pathname}`);

  // 1. BLOCK _RSC PARAMETERS (Critical for GSC)
  if (searchParams.has('_rsc')) {
    console.log('🚫 [SEO] Blocking _rsc parameter:', pathname);
    searchParams.delete('_rsc');
    url.search = searchParams.toString();
    return NextResponse.redirect(url, 301);
  }

  // 2. DETECT GOOGLEBOT
  const isGoogleBot = /googlebot|bingbot|slurp|duckduckbot/i.test(userAgent);

  // 3. CLEAN UP PROBLEMATIC PARAMETERS FOR BOTS
  if (isGoogleBot) {
    const problematicParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
    let hasProblematicParams = false;
    
    problematicParams.forEach(param => {
      if (searchParams.has(param)) {
        searchParams.delete(param);
        hasProblematicParams = true;
      }
    });
    
    if (hasProblematicParams) {
      url.search = searchParams.toString();
      console.log('🚫 [SEO] Cleaning problematic params for bot:', pathname);
      return NextResponse.redirect(url, 301);
    }
  }

  // 4. BLOCK INTERNAL PATHS FOR BOTS (but allow API routes for property lookups)
  const blockedPathsForBots = [
    '/_next/static/',
    '/_next/data/',
  ];
  
  // Only block API routes that are not needed for SEO
  const blockedApiPaths = [
    '/api/admin/',
    '/api/upload/',
    '/api/automacao/',
  ];
  
  if (isGoogleBot && blockedPathsForBots.some(path => pathname.startsWith(path))) {
    console.log('🚫 [SEO] Blocking internal path for bot:', pathname);
    return new NextResponse(null, { status: 404 });
  }

  // Block specific admin API routes for bots
  if (isGoogleBot && blockedApiPaths.some(path => pathname.startsWith(path))) {
    console.log('🚫 [SEO] Blocking admin API for bot:', pathname);
    return new NextResponse(null, { status: 404 });
  }

  // 5. HANDLE TRAILING SLASHES
  if (pathname.endsWith('/') && pathname.length > 1) {
    const withoutTrailingSlash = pathname.slice(0, -1);
    console.log(`🔍 [SEO] Removing trailing slash: ${pathname} → ${withoutTrailingSlash}`);
    
    const redirectUrl = new URL(withoutTrailingSlash, origin);
    searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    
    return NextResponse.redirect(redirectUrl, 301);
  }

  // 6. HANDLE PROPERTY REDIRECTS (imovel-{id} without slug)
  const imovelWithoutSlugMatch = pathname.match(/^\/imovel-(\d+)$/);
  if (imovelWithoutSlugMatch) {
    const id = imovelWithoutSlugMatch[1];
    console.log(`🔍 [SEO] Property without slug: ${pathname}`);
    
    // For SEO bots, allow the page to load and let the page component handle the redirect
    // This prevents redirect chains and API calls in middleware
    if (isGoogleBot) {
      console.log(`🔍 [SEO] Allowing bot to access property page: ${pathname}`);
      return NextResponse.next();
    }
    
    // For regular users, redirect to search to avoid 404s
    console.log(`🔍 [SEO] Redirecting user to search: ${pathname}`);
    return NextResponse.redirect(new URL('/busca', origin), 301);
  }

  // 7. HANDLE PROPERTY WITH SLUG (imovel-{id}/{slug})
  const imovelWithSlugMatch = pathname.match(/^\/imovel-(\d+)\/(.+)$/);
  if (imovelWithSlugMatch) {
    const [, id, currentSlug] = imovelWithSlugMatch;
    console.log(`🔍 [SEO] Property with slug: ID=${id}, SLUG=${currentSlug}`);

    // Block invalid slugs immediately
    const invalidSlugs = ['facebook.com/npiimoveis', 'instagram.com/npi_imoveis', 'indexdata/index.swf'];
    if (invalidSlugs.includes(currentSlug)) {
      console.log(`🔍 [SEO] Invalid slug detected, redirecting: ${currentSlug}`);
      return NextResponse.redirect(new URL(`/imovel-${id}`, origin), 301);
    }

    // For all requests, rewrite to internal route and let the page handle validation
    console.log(`🔍 [SEO] Rewriting property: /imovel/${id}/${currentSlug}`);
    const rewriteUrl = url.clone();
    rewriteUrl.pathname = `/imovel/${id}/${currentSlug}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  // 8. ADD SEO HEADERS
  const response = NextResponse.next();
  
  // Cache headers
  if (pathname.includes('.')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  
  // SEO headers
  response.headers.set('X-Robots-Tag', 'index, follow');
  
  console.log(`🔍 [SEO-MIDDLEWARE] ✅ Continuing: ${pathname}`);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap).*)',
  ],
};
