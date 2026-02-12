import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

const PARSE_PROMPT = `당신은 웨딩 업체의 문의 내용을 분석하는 AI입니다.
다음 문의에서 정보를 추출하세요. 없는 정보는 null로 표시합니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "name": "고객 이름 (없으면 null)",
  "phone": "연락처 (없으면 null)",
  "desired_date": "희망 날짜 YYYY-MM-DD (없으면 null)",
  "guest_count": 예상 인원수 (없으면 null),
  "budget_range": "예산 범위 텍스트 (없으면 null)",
  "inquiry_type": "GENERAL | DATE_CHECK | PRICE | VISIT | OTHER",
  "urgency": "LOW | MEDIUM | HIGH",
  "summary": "문의 핵심을 1줄로 요약"
}`;

export interface ParsedInquiry {
  name: string | null;
  phone: string | null;
  desired_date: string | null;
  guest_count: number | null;
  budget_range: string | null;
  inquiry_type: string;
  urgency: string;
  summary: string;
}

const FALLBACK: ParsedInquiry = {
  name: null,
  phone: null,
  desired_date: null,
  guest_count: null,
  budget_range: null,
  inquiry_type: "GENERAL",
  urgency: "MEDIUM",
  summary: "문의 내용 파싱 실패",
};

export async function parseInquiry(rawText: string): Promise<ParsedInquiry> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PARSE_PROMPT },
        { role: "user", content: rawText },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { ...FALLBACK, summary: rawText.slice(0, 50) };

    const parsed = JSON.parse(content) as ParsedInquiry;

    // Validate and sanitize
    return {
      name: parsed.name ?? null,
      phone: parsed.phone ?? null,
      desired_date: parsed.desired_date ?? null,
      guest_count:
        typeof parsed.guest_count === "number" ? parsed.guest_count : null,
      budget_range: parsed.budget_range ?? null,
      inquiry_type: parsed.inquiry_type || "GENERAL",
      urgency: parsed.urgency || "MEDIUM",
      summary: parsed.summary || rawText.slice(0, 50),
    };
  } catch {
    // Fallback on any error (API failure, JSON parse error, etc.)
    return { ...FALLBACK, summary: rawText.slice(0, 50) };
  }
}
