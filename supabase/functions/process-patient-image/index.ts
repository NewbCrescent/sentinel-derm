import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Detection = {
  label: string;
  confidence: number;
};

type UrgencyLevel = "routine" | "urgent" | "emergent";

type ClassificationResult = {
  detections: Detection[];
  urgencyLevel: UrgencyLevel;
  summary: string;
};

type PatientPayload = {
  patientId: string;
  imageUrl: string;
};

type PatientUpdate = {
  phone_number: string | null;
  created_at: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const selfiesBucket = "selfies";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validUrgencyLevels = new Set<UrgencyLevel>(["routine", "urgent", "emergent"]);

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePayload(value: unknown): PatientPayload | null {
  if (!isRecord(value)) {
    return null;
  }

  const { patientId, imageUrl } = value;

  if (typeof patientId !== "string" || !uuidPattern.test(patientId)) {
    return null;
  }

  if (typeof imageUrl !== "string") {
    return null;
  }

  try {
    const parsedUrl = new URL(imageUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }

  return { patientId, imageUrl };
}

function parseStoragePath(imageUrl: string): string | null {
  try {
    const parsedUrl = new URL(imageUrl);
    const publicPrefix = `/storage/v1/object/public/${selfiesBucket}/`;
    const authenticatedPrefix = `/storage/v1/object/authenticated/${selfiesBucket}/`;
    const matchingPrefix = [publicPrefix, authenticatedPrefix].find((prefix) =>
      parsedUrl.pathname.startsWith(prefix)
    );

    if (!matchingPrefix) {
      return null;
    }

    const storagePath = decodeURIComponent(parsedUrl.pathname.slice(matchingPrefix.length));

    if (!storagePath || storagePath.startsWith("/") || storagePath.includes("..")) {
      return null;
    }

    return storagePath;
  } catch {
    return null;
  }
}

function parseClassification(value: unknown): ClassificationResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const { detections, urgencyLevel, summary } = value;

  if (!Array.isArray(detections)) {
    return null;
  }

  const parsedDetections: Detection[] = [];

  for (const detection of detections) {
    if (!isRecord(detection)) {
      return null;
    }

    const { label, confidence } = detection;

    if (typeof label !== "string" || typeof confidence !== "number") {
      return null;
    }

    parsedDetections.push({ label, confidence });
  }

  if (
    typeof urgencyLevel !== "string" ||
    !validUrgencyLevels.has(urgencyLevel as UrgencyLevel) ||
    typeof summary !== "string"
  ) {
    return null;
  }

  return {
    detections: parsedDetections,
    urgencyLevel: urgencyLevel as UrgencyLevel,
    summary
  };
}

function errorFromRailwayBody(value: unknown, fallback: string): string {
  if (isRecord(value) && typeof value.detail === "string") {
    return value.detail;
  }

  return fallback;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function sendQueueSms(params: {
  to: string | null;
  queuePosition: number | null;
}): Promise<void> {
  const { to, queuePosition } = params;
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_NUMBER");

  if (!to || !queuePosition || !sid || !authToken || !from) {
    return;
  }

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `You're #${queuePosition} in line.`
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    console.error("Twilio SMS send failed.", {
      status: response.status,
      body: await response.text()
    });
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization" }, 401);
  }

  let payload: PatientPayload | null = null;

  try {
    payload = parsePayload(await request.json());
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!payload) {
    return jsonResponse({ error: "Invalid patientId or imageUrl" }, 400);
  }

  let supabaseUrl: string;
  let supabaseAnonKey: string;
  let railwayClassifyUrl: string;

  try {
    supabaseUrl = getRequiredEnv("SUPABASE_URL");
    supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    railwayClassifyUrl = getRequiredEnv("RAILWAY_CLASSIFY_URL");
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Function is not configured." },
      500
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const storagePath = parseStoragePath(payload.imageUrl);
  const imageForClassification = await (async () => {
    if (!storagePath) {
      return payload.imageUrl;
    }

    const signedUrlResult = await supabase.storage
      .from(selfiesBucket)
      .createSignedUrl(storagePath, 600);

    if (signedUrlResult.error || !signedUrlResult.data?.signedUrl) {
      return null;
    }

    return signedUrlResult.data.signedUrl;
  })();

  if (!imageForClassification) {
    return jsonResponse({ error: "invalid or unreachable image url" }, 400);
  }

  const imageUpdate = await supabase
    .from("patients")
    .update({
      image_url: payload.imageUrl,
      image_storage_path: storagePath
    })
    .eq("id", payload.patientId)
    .select("phone_number, created_at")
    .single<PatientUpdate>();

  if (imageUpdate.error || !imageUpdate.data) {
    return jsonResponse({ error: imageUpdate.error?.message ?? "not found" }, 400);
  }

  const classifyResponse = await fetch(railwayClassifyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ imageUrl: imageForClassification })
  });

  const classifyBody = await readJson(classifyResponse);

  if (!classifyResponse.ok) {
    const error = errorFromRailwayBody(
      classifyBody,
      classifyResponse.status === 400 ? "invalid or unreachable image url" : "AI down"
    );

    return jsonResponse({ error }, classifyResponse.status === 400 ? 400 : 500);
  }

  const classification = parseClassification(classifyBody);

  if (!classification) {
    return jsonResponse({ error: "AI down" }, 500);
  }

  const classificationUpdate = await supabase
    .from("patients")
    .update({
      detections: classification.detections,
      urgency_level: classification.urgencyLevel,
      summary: classification.summary
    })
    .eq("id", payload.patientId)
    .select("id")
    .single();

  if (classificationUpdate.error) {
    return jsonResponse({ error: classificationUpdate.error.message }, 500);
  }

  const queueResult = await supabase.rpc("get_patient_queue_position", {
    target_patient_id: payload.patientId
  });
  const queuePosition =
    typeof queueResult.data === "number" && Number.isInteger(queueResult.data)
      ? queueResult.data
      : null;

  await sendQueueSms({
    to: imageUpdate.data.phone_number,
    queuePosition
  });

  return jsonResponse(
    {
      detections: classification.detections,
      urgencyLevel: classification.urgencyLevel,
      summary: classification.summary,
      queuePosition
    },
    200
  );
});
