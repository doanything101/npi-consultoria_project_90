# NPi Consultoria - Real Estate Platform

A modern Next.js 14 real estate website with advanced SEO-friendly URLs and dynamic city management.

## 🏠 Project Overview

NPi Consultoria is a comprehensive real estate platform built with:

- **Next.js 14** with App Router
- **MongoDB** with Mongoose ODM  
- **Tailwind CSS** for styling
- **Firebase Admin SDK** for authentication
- **AWS S3** for file storage
- **Vercel** for deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB connection
- Environment variables configured

### Installation

1. **Clone and install:**
```bash
git clone <repository>
cd npi-consultoria
npm install
```

2. **Environment setup:**
```bash
# Copy environment variables from Vercel
vercel env pull .env.local
```

3. **Start development server:**
```bash
npm run dev
```

4. **Initial city migration (run once):**
```bash
curl -X POST http://localhost:3000/api/cities/migrate
```

## 🔗 SEO-Friendly URLs

### Search URLs
Transform complex query parameters into clean, SEO-optimized URLs:

- **Before**: `/busca?cidade=São+Paulo&finalidade=Comprar&categoria=Apartamento`
- **After**: `/buscar/venda/apartamentos/sao-paulo` ✅

### URL Structure
```
/buscar/{finalidade}/{categoria}/{cidade}/{bairro}
```

**Examples:**
- `/buscar/venda/apartamentos/sao-paulo`
- `/buscar/aluguel/casas/campinas`  
- `/buscar/venda/apartamentos/sao-paulo/vila-mariana`

### Dynamic Features
- ✅ **Real-time URL updates** when filters change
- ✅ **Dynamic page titles**: "Apartamentos à venda - São Paulo | NPi Imóveis"
- ✅ **Auto-sync cities** from property database
- ✅ **45+ cities** automatically managed

## 🛠 API Endpoints

### Property Search
- `GET /busca` - Main search page (internal)
- `GET /buscar/{finalidade}/{categoria}/{cidade}` - SEO-friendly URLs

### City Management
```bash
# Migration and sync
POST /api/cities/migrate          # Migrate cities from properties
POST /api/cities/auto-sync        # Force automatic sync

# City data
GET /api/cities                   # List all cities
GET /api/cities/slugs             # Get slug mappings
POST /api/cities                  # Create new city

# Admin
GET /api/admin/cities             # Admin interface
GET /api/admin/cities/stats       # Statistics
```

### Property Management
- `GET /api/imoveis` - List properties
- `POST /api/imoveis` - Create/update property (triggers city sync)
- `PUT /api/imoveis` - Update property
- `DELETE /api/imoveis` - Delete property

## 🏗 Architecture

### Database Models
- **Imovel** - Main property collection
- **City** - Dynamic city management with slugs
- **ImovelAtivo/ImovelInativo** - Status-based collections

### Key Systems
1. **URL Rewriting Middleware** - Converts SEO URLs to internal routes
2. **Auto-Sync System** - Automatically creates cities from new properties
3. **Dynamic Slug Generation** - Converts "São Paulo" → "sao-paulo"
4. **Cache Management** - 5-minute cache for optimal performance

### Directory Structure
```
src/app/
├── api/
│   ├── cities/              # City management APIs
│   │   ├── migrate/         # Migration endpoint
│   │   ├── auto-sync/       # Auto-sync system
│   │   └── slugs/           # Slug mapping
│   ├── imoveis/             # Property APIs
│   └── webhooks/            # Sync webhooks
├── models/
│   ├── City.js              # City model
│   └── Imovel.ts            # Property model
├── utils/
│   ├── url-slugs.js         # URL conversion utilities
│   └── city-sync-helper.js  # Sync automation
├── busca/                   # Search page
└── middleware.js            # URL rewriting logic
```

## 🔧 Development

### Common Commands
```bash
npm run dev                 # Development server
npm run build              # Production build
npm run lint               # ESLint checking
vercel --prod              # Deploy to production
```

### Testing URLs
```bash
# Test SEO-friendly URLs
curl http://localhost:3000/buscar/venda/apartamentos/sao-paulo
curl http://localhost:3000/buscar/aluguel/casas/campinas

# Check city sync status
curl http://localhost:3000/api/cities/auto-sync

# View city mappings  
curl http://localhost:3000/api/cities/slugs
```

### Migration Commands
```bash
# Run complete city migration
curl -X POST http://localhost:3000/api/cities/migrate

# Force sync if needed
curl -X POST http://localhost:3000/api/cities/auto-sync -d '{"force":true}' -H "Content-Type: application/json"

# Update property counts
curl -X POST http://localhost:3000/api/admin/cities/stats
```

## 🚀 Deployment

### Vercel Setup
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy to production
4. Run city migration on first deployment

### Environment Variables
```bash
MONGODB_URI=mongodb+srv://...
FIREBASE_PROJECT_ID=npi-imoveis  
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
NEXT_PUBLIC_SITE_URL=https://www.npiconsultoria.com.br
```

### Deployment Troubleshooting

#### Build Error: "Defina a variável de ambiente MONGODB_URI"
**Problem**: Vercel build fails with MongoDB URI error
**Solution**: 
1. Set `MONGODB_URI` environment variable in Vercel dashboard
2. Ensure the variable is available during build time
3. The code now handles missing environment variables gracefully during build

#### API Routes Not Working After Deployment
**Problem**: API routes return 503 errors
**Solution**: 
1. Verify all environment variables are set in Vercel
2. Check Vercel function logs for specific errors
3. Ensure MongoDB connection string is correct

#### Environment Variables Setup in Vercel
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all required variables for Production, Preview, and Development environments
4. Redeploy after adding variables

## 📊 Features

### SEO Optimization
- ✅ Clean, readable URLs
- ✅ Dynamic meta tags and titles
- ✅ OpenGraph and Twitter Cards
- ✅ Structured data for search engines

### Performance
- ✅ Server-side rendering with Next.js 14
- ✅ Intelligent caching system
- ✅ Image optimization
- ✅ Database query optimization

### Admin Features
- ✅ Property management interface
- ✅ City management and statistics
- ✅ Automated sync monitoring
- ✅ Real estate agent management

## 🔄 Auto-Sync System

The platform automatically detects and creates new cities when properties are added:

1. **Property created/updated** → Triggers webhook
2. **Webhook calls auto-sync** → Checks for new cities  
3. **Auto-sync creates cities** → Generates slugs automatically
4. **URLs work immediately** → No manual intervention needed

## 📝 Recent Updates (July 2025)

- ✅ Complete SEO-friendly URL system implementation
- ✅ Dynamic city management with 45+ cities
- ✅ Automatic synchronization system
- ✅ Real-time URL updates
- ✅ Enhanced middleware performance
- ✅ Database-driven slug mapping

## 📞 Support

For technical questions or deployment assistance, refer to the `CLAUDE.md` file for detailed implementation notes and troubleshooting guides.

---

**NPi Consultoria** - Negociação Personalizada de Imóveis | CRECI: 22013-J