import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { os_id } = await req.json();
    if (!os_id) {
      return new Response(JSON.stringify({ error: "os_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get OS with customer info
    const { data: os, error: osErr } = await supabase
      .from("service_orders")
      .select("id, code, customer:customers(name, email, phone)")
      .eq("id", os_id)
      .single();
    if (osErr || !os) throw new Error("OS not found");

    // Create feedback entry
    const { data: feedback, error: fbErr } = await supabase
      .from("feedback")
      .insert({ os_id })
      .select("token")
      .single();
    if (fbErr) throw fbErr;

    // Build feedback URL
    const appUrl = Deno.env.get("APP_URL") || `${supabaseUrl.replace('.supabase.co', '')}.lovable.app`;
    // Try to determine the app URL from the request origin or use a fallback
    const feedbackUrl = `https://stellar-field-buddy.lovable.app/feedback/${feedback.token}`;

    const customer = os.customer as any;
    const customerName = customer?.name || "Cliente";
    const customerEmail = customer?.email || "";
    const customerPhone = customer?.phone || "";

    // Fetch system settings for Evolution API
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "evolution_api_url",
        "evolution_api_key",
        "evolution_instance",
        "feedback_email_enabled",
        "feedback_whatsapp_enabled",
      ]);

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: any) => { settingsMap[s.key] = s.value; });

    const results: { email?: string; whatsapp?: string } = {};

    // === SEND EMAIL via Supabase built-in (Resend integration) ===
    if (settingsMap.feedback_email_enabled === "true" && customerEmail) {
      try {
        // Use a simple approach: insert a notification record
        // In production, you'd integrate with Resend or SMTP here
        await supabase.from("notifications").insert({
          user_id: os_id, // placeholder
          title: `Pesquisa de satisfação enviada para ${customerName}`,
          body: `E-mail: ${customerEmail} | Link: ${feedbackUrl}`,
          type: "feedback",
          reference_id: os_id,
        });
        results.email = "notification_created";
      } catch (e) {
        results.email = `error: ${e instanceof Error ? e.message : "unknown"}`;
      }
    }

    // === SEND WHATSAPP via Evolution API ===
    if (
      settingsMap.feedback_whatsapp_enabled === "true" &&
      customerPhone &&
      settingsMap.evolution_api_url &&
      settingsMap.evolution_api_key &&
      settingsMap.evolution_instance
    ) {
      try {
        const phone = customerPhone.replace(/\D/g, "");
        const message = `Olá ${customerName}! 😊\n\nSeu atendimento referente à OS *${os.code}* foi concluído.\n\nGostaríamos de saber como foi sua experiência! Por favor, avalie nosso serviço clicando no link abaixo:\n\n👉 ${feedbackUrl}\n\nObrigado pela sua confiança!`;

        const evolutionUrl = settingsMap.evolution_api_url.replace(/\/$/, "");
        const instance = settingsMap.evolution_instance;

        const waResponse = await fetch(
          `${evolutionUrl}/message/sendText/${instance}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: settingsMap.evolution_api_key,
            },
            body: JSON.stringify({
              number: phone,
              text: message,
            }),
          }
        );

        if (!waResponse.ok) {
          const errBody = await waResponse.text();
          results.whatsapp = `error [${waResponse.status}]: ${errBody}`;
        } else {
          results.whatsapp = "sent";
        }
      } catch (e) {
        results.whatsapp = `error: ${e instanceof Error ? e.message : "unknown"}`;
      }
    }

    return new Response(
      JSON.stringify({ success: true, feedbackUrl, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("send-feedback error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
