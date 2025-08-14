#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the HTML file
const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace environment variable placeholders
html = html.replace('{{STUDIOBUDDY_API_URL}}', process.env.STUDIOBUDDY_API_URL || 'https://studiobuddy-production.up.railway.app');
html = html.replace('{{VOCAL_REMOVER_API_URL}}', process.env.VOCAL_REMOVER_API_URL || 'https://vocal-remover-production-1bbc.up.railway.app');

// Write the processed file
fs.writeFileSync(htmlPath, html);

console.log('✅ Environment variables injected into HTML');
console.log('🔧 STUDIOBUDDY_API_URL:', process.env.STUDIOBUDDY_API_URL || 'https://studiobuddy-production.up.railway.app');
console.log('🔧 VOCAL_REMOVER_API_URL:', process.env.VOCAL_REMOVER_API_URL || 'https://vocal-remover-production-1bbc.up.railway.app');