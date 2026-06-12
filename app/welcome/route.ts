import { NextResponse } from "next/server";
import { getBackendLoginUrl } from "@/lib/wordpress";

export function GET() {
  return NextResponse.redirect(getBackendLoginUrl("/welcome/"), 302);
}
