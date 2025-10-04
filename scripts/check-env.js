#!/usr/bin/env node

/**
 * Environment check script for build process
 * This script checks if required environment variables are available
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'NEXT_PUBLIC_SITE_URL'
];

const optionalEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY'
];

console.log('🔍 Checking environment variables...');

let hasErrors = false;

// Check required variables
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Required environment variable missing: ${varName}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

// Check optional variables
optionalEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`⚠️  Optional environment variable missing: ${varName}`);
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

if (hasErrors) {
  console.error('\n❌ Build failed due to missing required environment variables');
  console.error('Please set the required environment variables in your Vercel dashboard or .env.local file');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are available');
  process.exit(0);
}
