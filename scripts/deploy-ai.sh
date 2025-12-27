#!/bin/bash

# 🛑 SECURITY SCRIPT
# This script sets the production secrets for your Supabase Edge Functions.
# It uses the key you provided. 

echo "🔐 Setting GEMINI_API_KEY in Supabase..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it or run this command manually:"
    echo "supabase secrets set GEMINI_API_KEY=AIzaSyCpSvgpnXgsb1HhqXbCbItZuuy4ti4tyYI"
    exit 1
fi

# Set the secret
supabase secrets set GEMINI_API_KEY=AIzaSyCpSvgpnXgsb1HhqXbCbItZuuy4ti4tyYI

echo "✅ Secret set successfully!"
echo "🚀 Now deploying function..."
supabase functions deploy search-gigs --no-verify-jwt

echo "🎉 Done! AI Search is live."
