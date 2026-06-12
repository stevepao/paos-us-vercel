"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

type ContactTurnstileProps = {
  siteKey: string;
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
    },
  ) => string;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function ContactTurnstile({ siteKey }: ContactTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderTurnstile = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
    });
  }, [siteKey]);

  useEffect(() => {
    renderTurnstile();

    return () => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = null;
    };
  }, [renderTurnstile]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderTurnstile}
      />
      <div ref={containerRef} />
    </>
  );
}
