import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const requestLog = new Map<string, number[]>();

function isRateLimited(identifier: string) {
  const now = Date.now();
  const recent = (requestLog.get(identifier) ?? []).filter((time) => now - time < 60_000);
  recent.push(now);
  requestLog.set(identifier, recent);
  return recent.length > 8;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "La llamada de voz aún no está configurada." },
      { status: 503 },
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const identifier = forwardedFor || "local";

  if (isRateLimited(identifier)) {
    return NextResponse.json(
      { error: "Has iniciado varias llamadas. Intenta nuevamente en un minuto." },
      { status: 429 },
    );
  }

  const safetyIdentifier = createHash("sha256")
    .update(`coffee-maker-pro:${identifier}`)
    .digest("hex");

  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": safetyIdentifier,
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: "gpt-realtime-2.1-mini",
        audio: { output: { voice: "cedar" } },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Unable to create OpenAI Realtime client secret", response.status);
    return NextResponse.json(
      { error: "No pudimos iniciar la llamada. Intenta nuevamente." },
      { status: 502 },
    );
  }

  const data = await response.json();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
