import { ksebPost } from "./kseb.client";

export interface CaptchaChallenge {
  sessionId: string;
  imageBase64: string;
}

export interface CaptchaVerifyResult {
  valid: boolean;
}

/**
 * Requests a new CAPTCHA image from the KSEB portal.
 * TODO: Map to the real KSEB captcha endpoint.
 */
export async function getCaptchaChallenge(): Promise<CaptchaChallenge> {
  return ksebPost<CaptchaChallenge>("/captcha/generate", {});
}

/**
 * Submits the user's CAPTCHA answer for server-side verification.
 */
export async function verifyCaptcha(
  sessionId: string,
  userAnswer: string
): Promise<CaptchaVerifyResult> {
  return ksebPost<CaptchaVerifyResult>("/captcha/verify", { sessionId, userAnswer });
}
