import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ message: "Logged out successfully" });
}
