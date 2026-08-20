"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, ShieldCheck, Sparkles, X } from "lucide-react";
import { RealtimeAgent, RealtimeSession, tool, type RealtimeItem } from "@openai/agents/realtime";
import { z } from "zod";
import { createOrder } from "@/app/actions/order";
import { MARCO_VOICE_PROMPT } from "@/lib/marco-voice-prompt";
import { PRODUCT } from "@/lib/product";

type CallState = "idle" | "connecting" | "connected" | "error";

const sections = {
  producto: "caracteristicas",
  regalo: "regalo",
  ahorro: "roi",
  precio: "oferta",
} as const;

function transcriptFromHistory(history: RealtimeItem[]) {
  return history.flatMap((item) => {
    if (item.type !== "message" || item.role === "system") return [];
    const text = item.content
      .map((content) => {
        if (content.type === "input_text" || content.type === "output_text") return content.text;
        if (content.type === "input_audio" || content.type === "output_audio") return content.transcript ?? "";
        return "";
      })
      .join(" ")
      .trim();
    return text ? [{ id: item.itemId, role: item.role, text }] : [];
  });
}

export default function VoiceSalesAssistant() {
  const [showInvite, setShowInvite] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isMarcoSpeaking, setIsMarcoSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState<Array<{ id: string; role: string; text: string }>>([]);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const invitationShownRef = useRef(false);

  const openCall = useCallback(() => {
    setShowInvite(false);
    setShowCall(true);
  }, []);

  useEffect(() => {
    const onOpen = () => openCall();
    window.addEventListener("marco:open-voice", onOpen);
    return () => window.removeEventListener("marco:open-voice", onOpen);
  }, [openCall]);

  useEffect(() => {
    if (sessionStorage.getItem("marco_voice_invite_dismissed")) return;
    let score = localStorage.getItem("coffee_maker_visited") ? 1 : 0;
    localStorage.setItem("coffee_maker_visited", "true");

    const maybeInvite = (points: number) => {
      score += points;
      if (score >= 3 && !invitationShownRef.current) {
        invitationShownRef.current = true;
        setShowInvite(true);
      }
    };

    const dwellTimer = window.setTimeout(() => maybeInvite(1), 45_000);
    const observers = Object.entries({ regalo: 1, roi: 1, oferta: 2 }).map(([id, points]) => {
      const target = document.getElementById(id);
      const observer = new IntersectionObserver(
        ([entry]) => entry.isIntersecting && maybeInvite(points),
        { threshold: 0.45 },
      );
      if (target) observer.observe(target);
      return observer;
    });

    return () => {
      window.clearTimeout(dwellTimer);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  useEffect(() => {
    if (callState !== "connected") return;
    const startedAt = Date.now();
    const clock = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1_000);
    const closingCue = window.setTimeout(() => {
      sessionRef.current?.sendMessage(
        "Control interno: ya van unos 45 segundos. Resume el valor y busca cerrar la compra o despedirte, sin interrumpir una conversación útil.",
      );
    }, 45_000);
    return () => {
      window.clearInterval(clock);
      window.clearTimeout(closingCue);
    };
  }, [callState]);

  const endCall = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    setCallState("idle");
    setIsMuted(false);
    setIsMarcoSpeaking(false);
    setElapsed(0);
  }, []);

  useEffect(() => () => sessionRef.current?.close(), []);

  const startCall = async () => {
    setCallState("connecting");
    setError("");
    setTranscript([]);

    try {
      const response = await fetch("/api/realtime/token", { method: "POST" });
      const credentials = await response.json();
      if (!response.ok) throw new Error(credentials.error || "No pudimos iniciar la llamada.");
      const ephemeralKey = credentials.value;
      if (!ephemeralKey) throw new Error("La credencial temporal no llegó correctamente.");

      const showPageSection = tool({
        name: "show_page_section",
        description: "Muestra en la página una sección relevante al cliente.",
        parameters: z.object({ section: z.enum(["producto", "regalo", "ahorro", "precio"]) }),
        execute: async ({ section }) => {
          document.getElementById(sections[section])?.scrollIntoView({ behavior: "smooth", block: "start" });
          return `Se mostró la sección ${section}.`;
        },
      });

      const orderFields = z.object({
        fullName: z.string(),
        email: z.string(),
        phone: z.string(),
        city: z.string(),
        address: z.string(),
      });

      const prepareOrder = tool({
        name: "prepare_order_summary",
        description: "Prepara el resumen que debe leerse antes de pedir confirmación.",
        parameters: orderFields,
        execute: async (order) => ({
          ...order,
          totalPrice: PRODUCT.price,
          paymentMethod: PRODUCT.paymentMethod,
          shipping: PRODUCT.shipping,
          warranty: PRODUCT.warranty,
          instruction: "Lee este resumen y pide una confirmación explícita. Todavía no crees el pedido.",
        }),
      });

      const createConfirmedOrder = tool({
        name: "create_confirmed_order",
        description: "Registra el pedido únicamente tras una confirmación verbal inequívoca del resumen.",
        parameters: orderFields.extend({ customerConfirmed: z.literal(true) }),
        execute: async ({ customerConfirmed: _confirmed, ...order }) => createOrder(order),
      });

      const finishCall = tool({
        name: "finish_call",
        description: "Finaliza la llamada después de despedirse.",
        parameters: z.object({ reason: z.string() }),
        execute: async ({ reason }) => {
          window.setTimeout(endCall, 1_500);
          return `Llamada finalizada: ${reason}`;
        },
      });

      const agent = new RealtimeAgent({
        name: "Marco",
        voice: "cedar",
        instructions: MARCO_VOICE_PROMPT,
        tools: [showPageSection, prepareOrder, createConfirmedOrder, finishCall],
      });
      const session = new RealtimeSession(agent, {
        model: "gpt-realtime-2.1-mini",
        transport: "webrtc",
        tracingDisabled: true,
      });

      session.on("audio_start", () => setIsMarcoSpeaking(true));
      session.on("audio_stopped", () => setIsMarcoSpeaking(false));
      session.on("history_updated", (history) => setTranscript(transcriptFromHistory(history)));
      session.on("error", (sessionError) => {
        console.error("Marco realtime session error", sessionError);
        setError("La llamada tuvo un problema. Puedes intentarlo de nuevo.");
        setCallState("error");
      });

      sessionRef.current = session;
      await session.connect({ apiKey: ephemeralKey });
      setCallState("connected");
      session.sendMessage("Saluda ahora como Marco, de Coffee Maker Pro, y haz una sola pregunta breve para conocer qué café quiere preparar.");
    } catch (callError) {
      sessionRef.current?.close();
      sessionRef.current = null;
      setError(callError instanceof Error ? callError.message : "No pudimos iniciar la llamada.");
      setCallState("error");
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    sessionRef.current?.mute(nextMuted);
    setIsMuted(nextMuted);
  };

  const dismissInvite = () => {
    setShowInvite(false);
    sessionStorage.setItem("marco_voice_invite_dismissed", "true");
  };

  const timeLabel = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <>
      {showInvite && !showCall && (
        <aside className="fixed bottom-40 left-4 z-[55] w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-gold-300/60 bg-[#fffaf3] p-4 shadow-2xl md:bottom-8 md:left-8" aria-label="Invitación a hablar con Marco">
          <button onClick={dismissInvite} className="absolute right-3 top-3 rounded-full p-1 text-coffee-500 hover:bg-coffee-100" aria-label="Cerrar invitación"><X size={18} /></button>
          <div className="flex gap-3 pr-6">
            <Image src="/images/logo-marco.jpg" width={54} height={54} alt="Marco, asesor de Coffee Maker Pro" className="h-14 w-14 rounded-full object-cover" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">¿Te ayudo a decidir?</p>
              <h2 className="mt-1 font-serif text-xl font-bold text-coffee-950">Habla con Marco por voz</h2>
              <p className="mt-1 text-sm leading-5 text-coffee-700">Cuéntale qué café te gusta y en un minuto sabrás si el kit te sirve. Si quieres, dejas el pedido listo en la misma llamada.</p>
            </div>
          </div>
          <button onClick={openCall} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-coffee-900 px-4 py-3 text-sm font-bold text-white hover:bg-coffee-800"><Phone size={17} /> Iniciar llamada</button>
        </aside>
      )}

      {showCall && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-coffee-950/65 p-0 backdrop-blur-sm md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="marco-call-title">
          <section className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] bg-[#fffaf3] shadow-2xl md:rounded-[2rem]">
            <button onClick={() => { endCall(); setShowCall(false); }} className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-coffee-800" aria-label="Cerrar"><X size={20} /></button>
            <div className="bg-gradient-to-br from-coffee-950 to-coffee-800 px-6 pb-7 pt-8 text-center text-white">
              <div className={`mx-auto h-24 w-24 rounded-full border-4 p-1 ${isMarcoSpeaking ? "animate-pulse border-gold-400 shadow-[0_0_35px_rgba(221,165,55,.55)]" : "border-white/20"}`}>
                <Image src="/images/logo-marco.jpg" width={88} height={88} alt="Marco" className="h-full w-full rounded-full object-cover" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Asesoría por voz · Coffee Maker Pro</p>
              <h2 id="marco-call-title" className="mt-1 font-serif text-3xl font-bold">Marco</h2>
              <p className="mt-1 text-sm text-coffee-200">{callState === "connected" ? (isMarcoSpeaking ? "Marco está hablando" : isMuted ? "Micrófono apagado" : "Marco te escucha") : callState === "connecting" ? "Conectando la llamada…" : "Asesoría breve por voz"}</p>
              {callState === "connected" && <p className="mt-2 font-mono text-sm text-gold-200">{timeLabel}</p>}
            </div>

            <div className="min-h-40 flex-1 overflow-y-auto px-5 py-4">
              {callState === "idle" && <><p className="text-center text-sm leading-6 text-coffee-700">Al iniciar, tu navegador pedirá permiso para usar el micrófono. Marco resuelve tus dudas y, si lo pides, deja el pedido registrado.</p><div className="mt-4 flex items-start gap-2 rounded-xl bg-white p-3 text-xs leading-5 text-coffee-600"><ShieldCheck className="mt-0.5 shrink-0 text-green-700" size={17} /> Ningún pedido se registra sin que confirmes en voz alta el resumen completo. Puedes colgar cuando quieras.</div></>}
              {callState === "connecting" && <div className="flex h-32 items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-coffee-200 border-t-gold-600" /></div>}
              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</div>}
              {callState === "connected" && transcript.length === 0 && <p className="text-center text-sm text-coffee-500">La conversación aparecerá aquí.</p>}
              {callState === "connected" && <div className="space-y-3">{transcript.slice(-8).map((line) => <div key={line.id} className={`rounded-2xl px-4 py-3 text-sm leading-5 ${line.role === "assistant" ? "mr-8 bg-white text-coffee-900" : "ml-8 bg-coffee-800 text-white"}`}><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider opacity-60">{line.role === "assistant" ? "Marco" : "Tú"}</span>{line.text}</div>)}</div>}
            </div>

            <div className="border-t border-coffee-100 bg-white p-4">
              {(callState === "idle" || callState === "error") && <button onClick={startCall} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-500 px-5 py-4 font-bold text-coffee-950 shadow-lg hover:bg-gold-400"><Sparkles size={19} /> {callState === "error" ? "Intentar de nuevo" : "Hablar con Marco"}</button>}
              {callState === "connected" && <div className="flex justify-center gap-5"><button onClick={toggleMute} className={`flex h-14 w-14 items-center justify-center rounded-full ${isMuted ? "bg-red-100 text-red-700" : "bg-coffee-100 text-coffee-900"}`} aria-label={isMuted ? "Activar micrófono" : "Silenciar micrófono"}>{isMuted ? <MicOff /> : <Mic />}</button><button onClick={endCall} className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white" aria-label="Finalizar llamada"><PhoneOff /></button></div>}
              <p className="mt-3 text-center text-[10px] leading-4 text-coffee-400">Duración objetivo: 1 minuto. Puedes finalizar cuando quieras.</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
