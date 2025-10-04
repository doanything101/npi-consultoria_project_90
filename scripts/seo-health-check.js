// scripts/seo-health-check.js - SEO Health Check Script

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.npiconsultoria.com.br';

// Test URLs to check
const testUrls = [
  '/',
  '/busca',
  '/sobre',
  '/contato',
  '/venda-seu-imovel',
  '/sobre/hub-imobiliarias',
  '/sobre/npi-imoveis',
  '/sobre/nossos-servicos',
  '/robots.txt',
  '/sitemap.xml',
  '/api/health', // Health check endpoint
  // Add some property URLs for testing
  '/imovel-123456', // This should redirect or show proper content
  '/imovel-123456/test-slug', // Property with slug
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    const fullUrl = `${BASE_URL}${url}`;
    const client = fullUrl.startsWith('https') ? https : http;
    
    const req = client.request(fullUrl, { method: 'HEAD' }, (res) => {
      resolve({
        url: fullUrl,
        status: res.statusCode,
        headers: {
          'x-robots-tag': res.headers['x-robots-tag'],
          'content-type': res.headers['content-type'],
          'location': res.headers['location'],
        },
        isRedirect: res.statusCode >= 300 && res.statusCode < 400,
        isError: res.statusCode >= 400,
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url: fullUrl,
        status: 'ERROR',
        error: err.message,
        isError: true,
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url: fullUrl,
        status: 'TIMEOUT',
        error: 'Request timeout',
        isError: true,
      });
    });
    
    req.end();
  });
}

async function checkRobotsTxt() {
  const result = await checkUrl('/robots.txt');
  if (result.status === 200) {
    console.log('✅ robots.txt is accessible');
    
    // Check if it allows important pages
    const client = BASE_URL.startsWith('https') ? https : http;
    const req = client.request(`${BASE_URL}/robots.txt`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data.includes('Disallow: /busca') || data.includes('Disallow: /imovel-')) {
          console.log('⚠️  robots.txt may be blocking important pages');
        } else {
          console.log('✅ robots.txt allows important pages');
        }
      });
    });
    req.on('error', () => console.log('❌ Could not read robots.txt content'));
    req.end();
  } else {
    console.log('❌ robots.txt is not accessible');
  }
}

async function checkSitemap() {
  const result = await checkUrl('/sitemap.xml');
  if (result.status === 200) {
    console.log('✅ sitemap.xml is accessible');
  } else {
    console.log('❌ sitemap.xml is not accessible');
  }
}

async function runHealthCheck() {
  console.log('🔍 Starting SEO Health Check...\n');
  
  // Check robots.txt and sitemap
  await checkRobotsTxt();
  await checkSitemap();
  
  console.log('\n🔍 Checking individual URLs...\n');
  
  const results = await Promise.all(testUrls.map(checkUrl));
  
  let issues = [];
  
  results.forEach(result => {
    const { url, status, headers = {}, isRedirect, isError } = result;
    
    if (isError) {
      console.log(`❌ ${url} - Status: ${status}`);
      issues.push(`${url} returned ${status}`);
    } else if (isRedirect) {
      console.log(`🔄 ${url} - Status: ${status} → ${headers.location || 'Unknown'}`);
    } else {
      console.log(`✅ ${url} - Status: ${status}`);
    }
    
    // Check for noindex tags
    if (headers['x-robots-tag'] && headers['x-robots-tag'].includes('noindex')) {
      console.log(`⚠️  ${url} has noindex tag`);
      issues.push(`${url} has noindex tag`);
    }
  });
  
  console.log('\n📊 Summary:');
  console.log(`Total URLs checked: ${testUrls.length}`);
  console.log(`Successful: ${results.filter(r => !r.isError && !r.isRedirect).length}`);
  console.log(`Redirects: ${results.filter(r => r.isRedirect).length}`);
  console.log(`Errors: ${results.filter(r => r.isError).length}`);
  
  if (issues.length > 0) {
    console.log('\n⚠️  Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('\n✅ No major issues found!');
  }
}

// Run the health check
runHealthCheck().catch(console.error);
