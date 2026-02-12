export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "신규 문의",
  CONTACTED: "상담 중",
  QUOTE_SENT: "견적 발송",
  VISIT_SCHEDULED: "방문 예정",
  CONTRACTED: "계약 완료",
  LOST: "이탈",
  ON_HOLD: "보류",
} as const;

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  INSTAGRAM_DM: "인스타그램 DM",
  KAKAO: "카카오톡",
  NAVER_FORM: "네이버 폼",
  WEBSITE: "웹사이트",
  PHONE: "전화 문의",
  OTHER: "기타",
} as const;

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
  URGENT: "긴급",
} as const;

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  WEDDING_HALL: "웨딩홀",
  STUDIO: "스튜디오",
  DRESS: "드레스",
  HONEYMOON: "허니문",
  INVITATION: "청첩장",
} as const;

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  INQUIRY_RECEIVED: "문의 접수",
  AUTO_REPLY_SENT: "자동 응답 발송",
  STAFF_NOTIFIED: "담당자 알림",
  CALL_MADE: "전화 연결",
  QUOTE_SENT: "견적 발송",
  FOLLOWUP_SENT: "팔로업 발송",
  VISIT_SCHEDULED: "방문 예약",
  STATUS_CHANGED: "상태 변경",
  NOTE_ADDED: "메모 추가",
} as const;

export const MESSAGE_TYPE_LABELS: Record<string, string> = {
  ALIMTALK: "알림톡",
  SMS: "문자",
  KAKAO: "카카오톡",
} as const;

export const MESSAGE_STATUS_LABELS: Record<string, string> = {
  PENDING: "대기 중",
  SENT: "발송 완료",
  DELIVERED: "전달 완료",
  FAILED: "발송 실패",
} as const;

export const TEMPLATE_TRIGGER_LABELS: Record<string, string> = {
  AUTO_REPLY: "자동 응답",
  QUOTE_SENT: "견적 발송",
  FOLLOWUP_D3: "3일 후 팔로업",
  FOLLOWUP_D7: "7일 후 팔로업",
  FOLLOWUP_D14: "14일 후 팔로업",
  CONTRACT_CONGRATS: "계약 축하",
  REVIEW_REQUEST: "후기 요청",
  CUSTOM: "커스텀",
} as const;
