import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    // Use service role key to query coordinates securely if needed
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? supabaseAnonKey;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { gig_id, max_workers = 10 } = await req.json();

    if (!gig_id) {
      return new Response(
        JSON.stringify({ error: "Missing gig_id in request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch gig location and skill category
    const { data: gig, error: gigError } = await supabase
      .from("gigs")
      .select("id, title, description, skill_id, location_id")
      .eq("id", gig_id)
      .single();

    if (gigError || !gig) {
      throw new Error(`Gig not found: ${gigError?.message ?? "unknown error"}`);
    }

    if (!gig.location_id) {
      throw new Error("Gig does not have an associated location.");
    }

    // 2. Fetch the location coordinates
    const { data: location, error: locError } = await supabase
      .from("locations")
      .select("latitude, longitude")
      .eq("id", gig.location_id)
      .single();

    if (locError || !location) {
      throw new Error(`Gig location not found: ${locError?.message ?? "unknown error"}`);
    }

    // 3. Call get_nearby_workers SQL RPC function
    const { data: workers, error: rpcError } = await supabase.rpc("get_nearby_workers", {
      target_lat: location.latitude,
      target_lng: location.longitude,
      radius_km: 15, // Default 15km matching radius
      skill_filter: gig.skill_id
    });

    if (rpcError) {
      throw new Error(`Failed to find nearby workers: ${rpcError.message}`);
    }

    // 4. Return matched workers up to max_workers
    const matched = (workers || []).slice(0, max_workers).map((w: any) => ({
      worker_id: w.worker_id,
      distance_km: w.distance_km,
      profile: w.profile,
      match_score: w.profile.rating ? (parseFloat(w.profile.rating) / 5) * 0.95 : 0.70, // Simple heuristic fallback
      reasons: ["Nearby location", w.profile.rating ? "High rating" : "Matches skill profile"]
    }));

    return new Response(JSON.stringify({ matched_workers: matched }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
