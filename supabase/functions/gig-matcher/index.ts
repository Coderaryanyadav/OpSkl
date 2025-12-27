// Follows Supabase Edge Function Deno patterns
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

console.log("Hello from Gig Matcher!");

serve(async (req) => {
    const { gig } = await req.json();

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);
    const model = genAI.getGenerativeModel({ model: "embedding-001" });

    try {
        // 1. Generate Embedding for the Gig
        const text = `${gig.title} ${gig.description} ${gig.requirements.join(' ')}`;
        const result = await model.embedContent(text);
        const embedding = result.embedding.values;

        // Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 2. Perform Similarity Search using pgvector
        // This assumes a function 'match_workers' exists in postgres
        const { data: matchedWorkers, error } = await supabaseClient.rpc('match_workers', {
            query_embedding: embedding,
            match_threshold: 0.7, // 70% relevance
            match_count: 10
        });

        if (error) throw error;

        return new Response(
            JSON.stringify({ matchedWorkers }),
            { headers: { "Content-Type": "application/json" } },
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
