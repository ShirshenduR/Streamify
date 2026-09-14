import { NextResponse } from "next/server";

/**
 * Runtime Firebase config.
 *
 * The Firebase keys are public by design (they ship inside every web client), but
 * they are read here at *runtime* rather than inlined at build time, because the
 * Docker image is built once and Render only injects env vars when the container
 * starts. Reading VITE_* keeps the existing env key names working untouched.
 */
export const dynamic = "force-dynamic";

const pick = (viteKey, nextKey) => process.env[viteKey] || process.env[nextKey] || "";

export function GET() {
  return NextResponse.json(
    {
      apiKey: pick("VITE_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_API_KEY"),
      authDomain: pick("VITE_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
      projectId: pick("VITE_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      storageBucket: pick("VITE_FIREBASE_STORAGE_BUCKET", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: pick(
        "VITE_FIREBASE_MESSAGING_SENDER_ID",
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
      ),
      appId: pick("VITE_FIREBASE_APP_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
