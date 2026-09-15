import { NextResponse } from "next/server";
import crypto from "crypto";
import { findService } from "@/lib/services";
import { getAvailableSlots } from "@/lib/booking";
import { isCalendarConfigured } from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceName = searchParams.get("service");
  const days = Number(searchParams.get("days") || "30");

  const service = findService(serviceName);
  if (!service) {
    return NextResponse.json({ error: "Servizio non riconosciuto." }, { status: 400 });
  }

  if (!isCalendarConfigured()) {
    return NextResponse.json(
      { error: "Il sistema di prenotazione online non è ancora attivo. Contattaci per fissare un appuntamento." },
      { status: 503 }
    );
  }

  try {
    const result = await getAvailableSlots(service, days);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[disponibilita] errore:", err);
    // DEBUG TEMPORANEO — da rimuovere dopo la diagnosi.
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
    const convertedKey = rawKey.replace(/\\n/g, "\n");
    const hash = crypto.createHash("sha256").update(convertedKey).digest("hex").slice(0, 16);
    console.error("[disponibilita][debug] rawLength:", rawKey.length, "convertedLength:", convertedKey.length, "sha256prefix:", hash, "clientEmail:", process.env.GOOGLE_CLIENT_EMAIL);
    return NextResponse.json(
      { error: "Impossibile leggere la disponibilità in questo momento. Riprova più tardi." },
      { status: 502 }
    );
  }
}
