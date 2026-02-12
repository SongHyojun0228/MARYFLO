import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Solapi delivery status callback payload.
 * @see https://developers.solapi.com/references/webhook
 */
interface SolapiWebhookPayload {
  messageId: string;
  statusCode: string;
  to: string;
  from: string;
  type: string;
  dateReceived?: string;
  dateCreated?: string;
}

/**
 * POST /api/webhooks/solapi?token=SOLAPI_WEBHOOK_SECRET
 *
 * Receives delivery status callbacks from Solapi.
 * Updates the corresponding Message record status.
 *
 * Solapi does not provide HMAC signature verification, so we use a
 * secret token in the webhook URL query parameter for authentication.
 * Set the webhook URL in Solapi console as:
 *   https://your-domain.com/api/webhooks/solapi?token=YOUR_SECRET
 */
export async function POST(request: Request) {
  // Verify webhook secret token
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const webhookSecret = process.env.SOLAPI_WEBHOOK_SECRET;

  if (webhookSecret && token !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Solapi can send single or array
    const payloads: SolapiWebhookPayload[] = Array.isArray(body)
      ? body
      : [body];

    const results = { updated: 0, notFound: 0, errors: 0 };

    for (const payload of payloads) {
      try {
        const { messageId, statusCode } = payload;

        if (!messageId) {
          results.errors++;
          continue;
        }

        // Map Solapi status codes to our MessageStatus
        const status = mapSolapiStatus(statusCode);

        // Find message by solapiMsgId
        const message = await prisma.message.findFirst({
          where: { solapiMsgId: messageId },
        });

        if (!message) {
          results.notFound++;
          continue;
        }

        await prisma.message.update({
          where: { id: message.id },
          data: {
            status,
            sentAt: status === "DELIVERED" ? new Date() : message.sentAt,
          },
        });

        results.updated++;
      } catch {
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("Solapi webhook error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * Map Solapi status code to our MessageStatus enum.
 * Solapi codes: 2000=success, 3xxx=pending, 4xxx=failed
 */
function mapSolapiStatus(
  statusCode: string
): "PENDING" | "SENT" | "DELIVERED" | "FAILED" {
  if (!statusCode) return "PENDING";

  const code = parseInt(statusCode, 10);

  if (code === 2000) return "DELIVERED";
  if (code >= 3000 && code < 4000) return "SENT";
  if (code >= 4000) return "FAILED";

  return "SENT";
}
