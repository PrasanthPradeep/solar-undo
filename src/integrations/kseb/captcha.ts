import { ksebGetBuffer, ksebGetResponse, ksebPostForm } from "./kseb.client";

export interface CaptchaChallenge {
  captchaUniqueIdHidden: string;
  imageBase64: string;
  contentType: string;
  jsessionId: string;
}

function readJSessionId(setCookie: string | null, fallback?: string) {
  const match = setCookie?.match(/\bJSESSIONID=([^;]+)/);
  if (!match?.[1] && fallback) return fallback;
  if (!match?.[1]) {
    throw new Error("KSEB QuickPay did not return a JSESSIONID cookie.");
  }
  return match[1];
}

function createCaptchaUniqueId() {
  return String(Date.now() + Math.floor(Math.random() * 10000) + 10000);
}

export function ksebSessionCookie(jsessionId: string) {
  return `JSESSIONID=${jsessionId}`;
}

export async function getCaptchaChallenge(): Promise<CaptchaChallenge> {
  const quickPayResponse = await ksebGetResponse("/selfservices/quickpay");
  let jsessionId = readJSessionId(quickPayResponse.headers.get("set-cookie"));

  const uniqueIdResponse = await ksebPostForm(
    "/selfservices/getUniqueId",
    {},
    {
      headers: {
        Cookie: ksebSessionCookie(jsessionId),
        Referer: "https://wss.kseb.in/selfservices/quickpay",
        "X-Requested-With": "XMLHttpRequest",
      },
    }
  );
  jsessionId = readJSessionId(uniqueIdResponse.headers.get("set-cookie"), jsessionId);

  const captchaUniqueIdHidden = createCaptchaUniqueId();
  const { buffer, contentType } = await ksebGetBuffer(
    `/selfservices/simpleImg.image?uniqId=${encodeURIComponent(captchaUniqueIdHidden)}`,
    {
      headers: {
        Cookie: ksebSessionCookie(jsessionId),
        Referer: "https://wss.kseb.in/selfservices/quickpay",
      },
    }
  );

  return {
    captchaUniqueIdHidden,
    imageBase64: buffer.toString("base64"),
    contentType,
    jsessionId,
  };
}
