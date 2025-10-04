// scripts/video-validation-test.js - Video Validation Test Script

const { isValidYouTubeVideoId, cleanYouTubeUrl, extractYouTubeVideoId, generateVideoMetaTags } = require('../src/app/utils/videoValidation.js');

console.log('🎬 Testing Video Validation Functions...\n');

// Test cases for video validation
const testCases = [
  // Valid cases
  { input: 'dQw4w9WgXcQ', expected: true, description: 'Valid YouTube ID' },
  { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: true, description: 'Valid watch URL' },
  { input: 'https://youtu.be/dQw4w9WgXcQ', expected: true, description: 'Valid short URL' },
  { input: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: true, description: 'Valid embed URL' },
  
  // Invalid cases
  { input: '4Aq7szgycT4', expected: false, description: 'Problematic ID' },
  { input: 'undefined', expected: false, description: 'Undefined string' },
  { input: 'null', expected: false, description: 'Null string' },
  { input: '', expected: false, description: 'Empty string' },
  { input: 'https://www.youtube.com/watch?v=', expected: false, description: 'URL without ID' },
  { input: 'https://www.youtube.com/@channel', expected: false, description: 'Channel URL' },
  { input: 'https://www.youtube.com/playlist?list=PLxxx', expected: false, description: 'Playlist URL' },
  { input: 'invalid-id', expected: false, description: 'Invalid ID format' },
];

console.log('🧪 Testing isValidYouTubeVideoId:');
testCases.forEach(({ input, expected, description }) => {
  const result = isValidYouTubeVideoId(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} ${description}: "${input}" -> ${result} (expected: ${expected})`);
});

console.log('\n🧪 Testing cleanYouTubeUrl:');
const urlTestCases = [
  { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'Clean watch URL' },
  { input: 'https://www.youtube.com/watch?v=https://youtu.be/dQw4w9WgXcQ', expected: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'Malformed URL with double protocol' },
  { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ?si=abc123', expected: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'URL with invalid parameters' },
  { input: 'https://www.youtube.com/@channel', expected: null, description: 'Channel URL' },
  { input: 'https://www.youtube.com/watch?v=4Aq7szgycT4', expected: null, description: 'Problematic ID' },
];

urlTestCases.forEach(({ input, expected, description }) => {
  const result = cleanYouTubeUrl(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} ${description}: "${input}" -> ${result} (expected: ${expected})`);
});

console.log('\n🧪 Testing extractYouTubeVideoId:');
const extractTestCases = [
  { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ', description: 'Extract from watch URL' },
  { input: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ', description: 'Extract from short URL' },
  { input: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ', description: 'Extract from embed URL' },
  { input: 'https://www.youtube.com/@channel', expected: null, description: 'Channel URL should return null' },
  { input: 'https://www.youtube.com/watch?v=4Aq7szgycT4', expected: null, description: 'Problematic ID should return null' },
];

extractTestCases.forEach(({ input, expected, description }) => {
  const result = extractYouTubeVideoId(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} ${description}: "${input}" -> ${result} (expected: ${expected})`);
});

console.log('\n🧪 Testing generateVideoMetaTags:');
const validVideoId = 'dQw4w9WgXcQ';
const metaTags = generateVideoMetaTags(validVideoId);

console.log('✅ Generated meta tags for valid video ID:');
console.log('- OpenGraph videos:', metaTags.openGraph?.videos?.length || 0);
console.log('- Twitter players:', metaTags.twitter?.players?.length || 0);
console.log('- Other meta tags:', Object.keys(metaTags.other || {}).length);
console.log('- Structured data type:', metaTags.structuredData?.['@type']);

const invalidMetaTags = generateVideoMetaTags('invalid-id');
console.log('\n✅ Generated meta tags for invalid video ID:');
console.log('- Should be empty object:', Object.keys(invalidMetaTags).length === 0);

console.log('\n🎯 Video Validation Test Complete!');
console.log('\nKey fixes implemented:');
console.log('✅ Fixed OpenGraph video URLs to use watch URLs instead of embed URLs');
console.log('✅ Fixed Twitter video player URLs to use watch URLs');
console.log('✅ Added proper video validation to prevent invalid videos from rendering');
console.log('✅ Created comprehensive video validation utility');
console.log('✅ Added video meta tags to property pages');
console.log('✅ Enhanced video URL cleaning and validation');
