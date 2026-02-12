interface SlackNotificationParams {
  webhookUrl: string;
  leadName: string;
  leadPhone: string;
  desiredDate?: string | null;
  guestCount?: number | null;
  leadId: string;
}

/**
 * Send a new inquiry notification to Slack.
 * Non-blocking: returns false on error without throwing.
 * In dev mode (no webhookUrl), logs to console.
 */
export async function sendSlackNotification({
  webhookUrl,
  leadName,
  leadPhone,
  desiredDate,
  guestCount,
  leadId,
}: SlackNotificationParams): Promise<boolean> {
  const formattedPhone = formatPhone(leadPhone);
  const datePart = desiredDate
    ? formatDate(desiredDate)
    : "날짜 미정";
  const guestPart = guestCount ? `${guestCount}명` : "인원 미정";

  const text = `🔔 신규 문의 | ${leadName} | ${datePart} | ${guestPart} | ${formattedPhone}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const leadUrl = `${appUrl}/dashboard/leads/${leadId}`;

  const payload = {
    text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🔔 신규 문의가 접수되었습니다*\n\n• 고객: ${leadName}\n• 연락처: ${formattedPhone}\n• 희망 날짜: ${datePart}\n• 예상 인원: ${guestPart}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "문의 확인하기" },
            url: leadUrl,
          },
        ],
      },
    ],
  };

  if (!webhookUrl) {
    console.log("[DEV MODE] sendSlackNotification:", text);
    return true;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Slack webhook failed:", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Slack notification error:", error);
    return false;
  }
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  } catch {
    return dateStr;
  }
}
