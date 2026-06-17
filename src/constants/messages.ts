export const MESSAGES = {
  errors: {
    CONSUMER_NOT_FOUND: "No consumer found with the provided details. Please check your consumer number and mobile number.",
    INVALID_CONSUMER_NUMBER: "Consumer number must be exactly 13 digits.",
    INVALID_MOBILE: "Please enter a valid 10-digit Indian mobile number.",
    INTERNAL_ERROR: "Something went wrong. Please try again later.",
    CAPTCHA_FAILED: "Captcha verification failed. Please try again.",
  },
  success: {
    ELIGIBLE: "Great news! Your connection is eligible for rooftop solar installation.",
    INELIGIBLE: "Unfortunately, the transformer serving your area has reached its solar hosting capacity.",
  },
  ui: {
    LOADING: "Checking your eligibility…",
    SUBMIT: "Check Eligibility",
  },
} as const;
