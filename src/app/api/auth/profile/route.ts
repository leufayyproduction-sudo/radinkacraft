import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    return NextResponse.json(profile ? { name: profile.name, email: profile.email } : null);
  } catch {
    return NextResponse.json(null);
  }
}
