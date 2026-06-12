import { NextResponse } from "next/server";
import { getBackendLoginUrl } from "@/lib/wordpress";

export function GET() {
  return NextResponse.redirect(getBackendLoginUrl("/pokemon-go-the-grind-begins/"), 302);
}
