import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getOptionalEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  const redirectUrl = new URL("/contact/", request.url);

  if (website) {
    redirectUrl.searchParams.set("status", "sent");
    return NextResponse.redirect(redirectUrl);
  }

  if (!name || !email || !message) {
    redirectUrl.searchParams.set("status", "missing-fields");
    return NextResponse.redirect(redirectUrl);
  }

  if (name.length > 120 || email.length > 254 || message.length > 5000) {
    redirectUrl.searchParams.set("status", "too-long");
    return NextResponse.redirect(redirectUrl);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectUrl.searchParams.set("status", "invalid-email");
    return NextResponse.redirect(redirectUrl);
  }

  const turnstileConfigured = Boolean(
    getOptionalEnv("NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY") ||
      getOptionalEnv("CONTACT_TURNSTILE_SECRET_KEY"),
  );

  if (turnstileConfigured) {
    const turnstileOk = await verifyTurnstileToken(
      turnstileToken,
      request.headers.get("cf-connecting-ip") ??
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    );

    if (!turnstileOk) {
      redirectUrl.searchParams.set("status", "turnstile-failed");
      return NextResponse.redirect(redirectUrl);
    }
  }

  const host = getOptionalEnv("SMTP_HOST");
  const user = getOptionalEnv("SMTP_USER");
  const pass = getOptionalEnv("SMTP_PASS");
  const from = getOptionalEnv("SMTP_FROM") ?? "webmaster@hillwork.com";
  const to = getOptionalEnv("CONTACT_TO") ?? "us@spao.net";

  if (!host || !user || !pass) {
    redirectUrl.searchParams.set("status", "missing-config");
    return NextResponse.redirect(redirectUrl);
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to,
    replyTo: email,
    subject: `Pao Family contact form: ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      message,
    ].join("\n"),
  });

  redirectUrl.searchParams.set("status", "sent");
  return NextResponse.redirect(redirectUrl);
}

async function verifyTurnstileToken(token: string, remoteIp?: string | null): Promise<boolean> {
  const secret = getOptionalEnv("CONTACT_TURNSTILE_SECRET_KEY");

  if (!secret || !token) {
    return false;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });

  if (!response.ok) {
    return false;
  }

  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}
