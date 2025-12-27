import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from Functions!")

// Initialize Gemini
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } })
  }

  try {
    const { query } = await req.json()

    if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY')

    // 1. Call Gemini for Semantics
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this search query for a gig/job: "${query}". 
            Valid categories: Social, Creative, Technical, Design, Visuals, Intel, Logistics, Signal.
            Return a JSON object with: { "category": string | null, "keywords": string }`
          }]
        }]
      })
    })

    const data = await response.json()
    const text = data.candidates[0].content.parts[0].text
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const analysis = JSON.parse(cleanedJson)

    // 2. Query Supabase (Securely)
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
    
    let dbQuery = supabase.from('gigs').select('*, client:profiles(*)')
    .eq('status', 'open')

    if (analysis.category && analysis.category !== 'null') {
      dbQuery = dbQuery.eq('category', analysis.category)
    }
    
    // Semantic title search
    if (analysis.keywords) {
      dbQuery = dbQuery.ilike('title', `%${analysis.keywords}%`)
    }

    const { data: gigs, error } = await dbQuery.order('created_at', { ascending: false })

    if (error) throw error

    return new Response(JSON.stringify({ 
      success: true, 
      analysis, 
      gigs 
    }), {
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    })
  }
})
