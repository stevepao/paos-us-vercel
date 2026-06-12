import { NextResponse } from "next/server";
import { getWordPressSiteUrl } from "@/lib/env";

export function redirectToWordPressAccountPath(request: Request, path: string) {
  const requestUrl = new URL(request.url);
  const target = new URL(path, getWordPressSiteUrl());

  requestUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  return NextResponse.redirect(target, 302);
}
