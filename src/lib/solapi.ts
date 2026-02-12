import { SolapiMessageService } from "solapi";

interface SendAlimtalkParams {
  to: string;
  templateId: string;
  variables: Record<string, string>;
  smsContent?: string;
}

interface SendAlimtalkResult {
  success: boolean;
  messageId?: string;
  error?: string;
  method?: "alimtalk" | "sms" | "dev";
}

/**
 * Normalize Korean phone number to E.164 format without country code prefix.
 * "010-1234-5678" -> "01012345678"
 * "+82 10 1234 5678" -> "01012345678"
 */
export function normalizePhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("82") && digits.length >= 11) {
    digits = "0" + digits.slice(2);
  }

  return digits;
}

function getSolapiClient(): SolapiMessageService | null {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;

  if (!apiKey || !apiSecret) {
    return null;
  }

  return new SolapiMessageService(apiKey, apiSecret);
}

/**
 * Send SMS directly via Solapi.
 */
export async function sendSms({
  to,
  content,
}: {
  to: string;
  content: string;
}): Promise<SendAlimtalkResult> {
  const normalizedTo = normalizePhoneNumber(to);
  const senderPhone = process.env.SOLAPI_SENDER_PHONE;

  const client = getSolapiClient();

  if (!client) {
    console.log("[DEV MODE] sendSms:", { to: normalizedTo, content });
    return { success: true, messageId: `dev_sms_${Date.now()}`, method: "dev" };
  }

  if (!senderPhone) {
    return { success: false, error: "SOLAPI_SENDER_PHONE not configured" };
  }

  try {
    const response = await client.sendOne({
      to: normalizedTo,
      from: senderPhone,
      text: content,
    });

    return { success: true, messageId: response.messageId, method: "sms" };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown SMS error";
    console.error("SMS send failed:", err);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send Kakao Alimtalk via Solapi.
 * Falls back to SMS if alimtalk fails or is not configured.
 * In dev mode (no API keys), logs to console and returns mock success.
 *
 * @param smsContent - Rendered message text for SMS fallback.
 *                     If not provided, SMS fallback is skipped.
 */
export async function sendAlimtalk({
  to,
  templateId,
  variables,
  smsContent,
}: SendAlimtalkParams): Promise<SendAlimtalkResult> {
  const normalizedTo = normalizePhoneNumber(to);
  const senderPhone = process.env.SOLAPI_SENDER_PHONE;
  const pfId = process.env.SOLAPI_KAKAO_PF_ID;

  const client = getSolapiClient();

  // Dev mode: no API keys configured
  if (!client) {
    console.log("[DEV MODE] sendAlimtalk:", {
      to: normalizedTo,
      templateId,
      variables,
    });
    return { success: true, messageId: `dev_${Date.now()}`, method: "dev" };
  }

  if (!senderPhone) {
    return { success: false, error: "SOLAPI_SENDER_PHONE not configured" };
  }

  // If kakao pfId is not configured, go straight to SMS
  if (!pfId) {
    console.log("SOLAPI_KAKAO_PF_ID not set, sending SMS directly");
    if (smsContent) {
      return sendSms({ to, content: smsContent });
    }
    return { success: false, error: "No pfId and no SMS content" };
  }

  // Attempt Kakao Alimtalk
  try {
    const response = await client.sendOne({
      to: normalizedTo,
      from: senderPhone,
      kakaoOptions: {
        pfId,
        templateId,
        variables,
      },
    });

    return { success: true, messageId: response.messageId, method: "alimtalk" };
  } catch (alimtalkError) {
    console.warn("Alimtalk failed, falling back to SMS:", alimtalkError);

    // SMS fallback with rendered content
    if (smsContent) {
      return sendSms({ to, content: smsContent });
    }

    const errorMessage =
      alimtalkError instanceof Error
        ? alimtalkError.message
        : "Alimtalk failed";
    return { success: false, error: errorMessage };
  }
}
