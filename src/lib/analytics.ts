type AnalyticsEventName =
  | "consumer_details_submitted"
  | "captcha_completed"
  | "verification_success"
  | "verification_failed"
  | "pdf_fetched"
  | "transformer_identified"
  | "solar_check"
  | "result_shown";

type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: AnalyticsEventName,
      params?: AnalyticsEventParams
    ) => void;
  }
}

export function trackEvent(name: AnalyticsEventName, params?: AnalyticsEventParams) {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", name, params);
}
