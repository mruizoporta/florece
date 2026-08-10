import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./api";

/** Direct API origin — Socket.IO cannot use the Next `/backend` rewrite reliably. */
export function getWsBaseUrl(): string {
  if (typeof window === "undefined") return "http://127.0.0.1:3001";
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (api?.startsWith("http")) return api.replace(/\/$/, "");
  return "http://127.0.0.1:3001";
}

export type AppointmentRealtimeEvent = {
  id: number;
  name: string | null;
  date: string;
};

export function connectAppointmentsSocket(tenantSlug: string): Socket {
  const token = getAccessToken();
  return io(`${getWsBaseUrl()}/appointments`, {
    auth: { token, tenantSlug },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 8000,
  });
}

/** Short alert tone for reception TVs / open boards. */
export function playNewAppointmentBeep() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    for (const [i, freq] of [880, 1174.7].entries()) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02 + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18 + i * 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + 0.22 + i * 0.12);
    }

    void ctx.resume();
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    // Autoplay may be blocked until the user interacts with the page.
  }
}
