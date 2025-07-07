# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 real estate website (NPI Consultoria) with the following key characteristics:

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom components
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK
- **File Storage**: AWS S3 integration
- **Package Manager**: npm (use npm, not pnpm)
- **Code Quality**: ESLint for linting
- **Deployment**: Vercel with automatic deployments

## Common Commands

### Development
```bash
npm run dev              # Start development server on port 3000
npm run build            # Production build
npm start                # Start production server
npm run lint             # ESLint checking
```

### Vercel Deployment
```bash
vercel --prod            # Deploy to production
vercel env pull .env.local  # Pull environment variables from Vercel
vercel env ls            # List environment variables
```

## Critical Architecture Notes

### URL Routing System
**IMPORTANT**: The project uses a complex URL rewriting system that was recently fixed:

#### Public URLs (Google-indexed):
- Properties without slug: `/imovel-{id}` (e.g., `/imovel-1715`)
- Properties with slug: `/imovel-{id}/{slug}` (e.g., `/imovel-1715/helbor-brooklin`) 
- Condominiums: `/{slug}` (e.g., `/helbor-brooklin`)

#### Internal Routing:
- Properties: `/imovel/{id}/{slug}` (actual Next.js route)
- Middleware rewrites public URLs to internal routes

#### Recent Fixes (July 2025):
- ✅ Fixed middleware vs next.config.mjs conflict
- ✅ Removed conflicting redirects from next.config.mjs  
- ✅ Middleware now handles all property route logic
- ✅ Works consistently on both Vercel and local development

### Meta Tags & SEO
**Recently implemented og:image fixes**:
- ✅ Property pages: Extract image from `imovel.Foto` array (first image)
- ✅ Condominium pages: Extract from `condominio.Foto` array (featured or first)
- ✅ Proper OpenGraph format with dimensions (1200x630)
- ✅ Twitter Cards with proper image objects
- ✅ All pages include: title, description, url, type, siteName, images

### Admin Panel
**Location**: `/admin/` with following key pages:
- `/admin/dashboard` - Overview with statistics  
- `/admin/corretores` - Real estate agents management
- `/admin/imoveis` - Property management
- `/admin/automacao` - Automation tools

**Recent Fixes**:
- ✅ Firebase Admin credentials configured locally via `vercel env pull`
- ✅ Corretores page loads all brokers automatically (fixed API response structure)
- ✅ Dashboard null safety checks for array operations
- ✅ Pagination working with handlePageChange function

## Directory Structure
```
/src/app/
├── (site)/[slug]/          # Condominium pages
├── imovel/[id]/[slug]/     # Property pages (internal route)
├── admin/                  # Admin panel
├── api/                    # API routes
├── components/             # Reusable UI components
├── models/                 # Mongoose data models
├── lib/                    # Utility libraries
├── store/                  # Zustand state management
└── utils/                  # Helper functions
```

## Database Models & Data Structure

### Property Data (`imovel.Foto`):
```javascript
// Foto is an array of objects:
[{
  "Codigo": "14819",
  "Foto": "https://npi-imoveis.s3.sa-east-1.amazonaws.com/...",
  "FotoPequena": "https://cdn.vistahost.com.br/..."
}]
```

### Condominium Data (`condominio.Foto`):
```javascript
// Similar structure with optional Destaque field:
[{
  "Codigo": "123",
  "Foto": "https://...",
  "FotoPequena": "https://...",
  "Destaque": "Sim" // Featured image
}]
```

## Environment Variables

### Required Variables (managed via Vercel):
```bash
# Database
MONGODB_URI=mongodb+srv://...

# Firebase Admin
FIREBASE_PROJECT_ID=npi-imoveis
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=sa-east-1

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://www.npiconsultoria.com.br
```

**Setup**: Run `vercel env pull .env.local` to get all environment variables locally.

## Common Issues & Solutions

### 1. Route Not Working (404)
**Problem**: URLs like `/imovel-1715` return 404
**Solution**: Check middleware.js - ensure no conflicts with next.config.mjs redirects

### 2. Admin Page Empty/Error
**Problem**: Admin pages don't load data or show Firebase errors
**Solution**: Run `vercel env pull .env.local` to get Firebase credentials

### 3. Missing og:image
**Problem**: Social media previews don't show images
**Solution**: Check that image extraction handles array structure correctly:
```javascript
// Correct way to extract image URL:
const imageUrl = Array.isArray(imovel.Foto) && imovel.Foto.length > 0 
  ? (imovel.Foto[0].Foto || imovel.Foto[0].FotoPequena)
  : fallbackImage;
```

### 4. Build Errors
**Problem**: Next.js build fails
**Solution**: 
- Check for undefined array operations (add null safety)
- Run `npm run build` locally before deploying
- Check for missing required props in components

## API Endpoints

### Key APIs:
- `GET /api/imoveis/{id}` - Get property by ID
- `GET /api/admin/corretores` - List real estate agents (supports pagination)
- `GET /api/condominios/slug` - Get condominium by slug
- `GET /api/search/*` - Various search endpoints

### Response Structure:
```javascript
// Typical API response:
{
  "status": 200,
  "data": {...},           // Single object
  "corretores": [...],     // Array (for corretores endpoint)
  "pagination": {          // When applicable
    "totalItems": 50,
    "totalPages": 5,
    "currentPage": 1,
    "itemsPerPage": 10
  }
}
```

## Development Workflow

### Before Making Changes:
1. Run `vercel env pull .env.local` if working with admin features
2. Check if URLs follow the rewriting pattern (public vs internal)
3. Test both locally (`npm run dev`) and on Vercel

### Making Route Changes:
- **DON'T** modify next.config.mjs redirects (causes conflicts)
- **DO** modify middleware.js for URL handling
- **TEST** both `/imovel-{id}` and `/imovel-{id}/{slug}` patterns

### Deploying:
1. Run `npm run build` locally first
2. Fix any build errors before pushing
3. Use `git push origin master` for automatic Vercel deployment
4. Monitor Vercel dashboard for deployment status

## Recent Major Changes (July 2025)

1. **Fixed URL Routing**: Resolved middleware vs next.config.mjs conflicts
2. **Admin Panel**: Firebase credentials, pagination, null safety  
3. **SEO Meta Tags**: og:image working for properties and condominiums
4. **Social Sharing**: Enhanced OpenGraph and Twitter Cards
5. **Build Stability**: Fixed array operations and undefined checks

## Performance Notes
- Images optimized via Next.js Image component
- Multiple CDN hostnames configured in next.config.mjs
- Standalone output for Vercel deployment
- Middleware handles URL rewrites efficiently

---

**Last Updated**: July 2025 - After major routing fixes and admin panel improvements

## Development Branch Setup
- ✅ Branch `dev` created for development work
- ✅ Vercel Preview environments automatically configured  
- ✅ Production remains on `master` branch