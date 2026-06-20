type AnalyticsEventName =
  | "consumer_details_submitted"
  | "consumer_cache_hit"
  | "consumer_cache_miss"
  | "captcha_completed"
  | "verification_success"
  | "verification_failed"
  | "pdf_fetched"
  | "transformer_identified"
  | "solar_check"
  | "result_shown"
  | "support_modal_opened"
  | "support_amount_selected"
  | "support_upi_app_opened"
  | "support_upi_copied";

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
