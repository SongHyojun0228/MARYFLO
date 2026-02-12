# Mariflo (마리플로) — 웨딩 리드 자동화 SaaS

## 프로젝트 개요

**Mariflo**는 웨딩 업체(웨딩홀, 스튜디오, 드레스숍, 허니문 여행사)의 리드 → 계약 전환 과정을 자동화하는 B2B SaaS.
고객 문의가 들어오면 3초 내 자동 응답, 담당자 즉시 알림, 자동 팔로업 시퀀스로 전환율을 극대화한다.
이름은 Marry + Flow의 합성어.

**핵심 원칙: AI가 고객과 직접 대화하지 않는다. AI는 뒤에서 데이터를 파싱하고, 정해진 메시지를 정해진 타이밍에 발송할 뿐이다. 실제 상담은 사람이 한다.**

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **ORM**: Prisma
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand (클라이언트), TanStack Query (서버 상태)
- **Cron/Queue**: Vercel Cron + Inngest (또는 BullMQ) — 팔로업 스케줄링용
- **Deployment**: Vercel
- **Auth**: Supabase Auth (매직링크 or 카카오 소셜 로그인)

## 외부 API 연동

| 서비스 | 용도 | SDK/API |
|--------|------|---------|
| **Solapi** | 카카오 알림톡 발송 | `solapi` npm 패키지 |
| **OpenAI** | 문의 내용 파싱 (날짜/인원/예산 추출) | `openai` npm 패키지, GPT-4o-mini |
| **Google Calendar** | 날짜 가용성 확인 | `googleapis` npm 패키지 |
| **Instagram Graph API** | DM 수신 웹훅 (선택) | Meta Webhooks |
| **Slack** | 담당자 알림 (선택) | Slack Webhook URL |

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # 로그인
│   │   └── signup/page.tsx         # 회원가입 (업체 등록)
│   ├── (dashboard)/
│   │   ├── layout.tsx              # 대시보드 레이아웃 (사이드바)
│   │   ├── page.tsx                # 메인 대시보드 (오늘의 요약)
│   │   ├── leads/
│   │   │   ├── page.tsx            # 리드 목록 (칸반 보드)
│   │   │   └── [id]/page.tsx       # 리드 상세 (타임라인, 메모)
│   │   ├── messages/page.tsx       # 알림톡 발송 이력
│   │   ├── calendar/page.tsx       # 일정 관리 (가용 날짜)
│   │   ├── templates/page.tsx      # 알림톡 템플릿 관리
│   │   ├── sequences/page.tsx      # 팔로업 시퀀스 설정
│   │   ├── reports/page.tsx        # 주간/월간 리포트
│   │   └── settings/page.tsx       # 업체 정보, API 키, 알림 설정
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── inquiry/route.ts    # 외부 문의 수신 (폼, 인스타 등)
│   │   │   └── solapi/route.ts     # 알림톡 발송 결과 콜백
│   │   ├── leads/route.ts          # 리드 CRUD
│   │   ├── messages/route.ts       # 메시지 발송
│   │   ├── parse/route.ts          # AI 문의 파싱
│   │   ├── cron/
│   │   │   ├── followup/route.ts   # 팔로업 스케줄 실행 (Vercel Cron)
│   │   │   └── report/route.ts     # 주간 리포트 생성
│   │   └── auth/[...supabase]/route.ts
│   └── inquiry/[businessId]/page.tsx  # 공개 문의 폼 (임베드용)
├── components/
│   ├── ui/                         # shadcn/ui 컴포넌트
│   ├── dashboard/
│   │   ├── LeadKanban.tsx          # 칸반 보드 (신규→상담중→견적→계약)
│   │   ├── LeadTimeline.tsx        # 리드별 활동 타임라인
│   │   ├── StatsCard.tsx           # KPI 카드
│   │   ├── WeeklyReport.tsx        # 주간 리포트 뷰
│   │   └── SequenceEditor.tsx      # 팔로업 시퀀스 편집기
│   └── forms/
│       └── InquiryForm.tsx         # 공개 문의 폼 컴포넌트
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Supabase 클라이언트
│   │   ├── server.ts               # 서버 컴포넌트용
│   │   └── middleware.ts           # Auth 미들웨어
│   ├── solapi.ts                   # 알림톡 발송 유틸
│   ├── openai.ts                   # 문의 파싱 유틸
│   ├── google-calendar.ts          # 캘린더 연동
│   ├── slack.ts                    # Slack 알림
│   └── constants.ts                # 리드 상태, 시퀀스 단계 등 상수
├── types/
│   └── index.ts                    # 전역 타입 정의
└── prisma/
    └── schema.prisma               # DB 스키마
```

## 데이터베이스 스키마 (핵심 테이블)

```prisma
model Business {
  id              String   @id @default(cuid())
  name            String                          // 업체명
  type            BusinessType                    // WEDDING_HALL, STUDIO, DRESS, HONEYMOON, INVITATION
  phone           String
  email           String?
  kakaoChannelId  String?                         // 카카오 채널 ID
  solapiApiKey    String?                         // Solapi API 키 (암호화)
  solapiSecret    String?                         // Solapi Secret (암호화)
  slackWebhook    String?                         // Slack 알림 URL
  googleCalendarId String?                        // Google Calendar ID
  createdAt       DateTime @default(now())
  leads           Lead[]
  templates       MessageTemplate[]
  sequences       FollowupSequence[]
  staffMembers    Staff[]
}

model Staff {
  id          String   @id @default(cuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id])
  name        String
  phone       String
  role        String?                             // 웨딩플래너, 매니저 등
  isActive    Boolean  @default(true)
  leads       Lead[]
}

model Lead {
  id              String     @id @default(cuid())
  businessId      String
  business        Business   @relation(fields: [businessId], references: [id])
  assignedStaffId String?
  assignedStaff   Staff?     @relation(fields: [assignedStaffId], references: [id])

  // 고객 정보
  name            String
  phone           String
  email           String?
  source          LeadSource                      // INSTAGRAM_DM, KAKAO, NAVER_FORM, WEBSITE, PHONE, OTHER

  // AI 파싱 결과
  desiredDate     DateTime?                       // 희망 날짜
  guestCount      Int?                            // 예상 인원
  budgetRange     String?                         // 예산 범위
  rawInquiry      String                          // 원본 문의 내용
  parsedData      Json?                           // AI 파싱 전체 결과

  // 상태 관리
  status          LeadStatus @default(NEW)        // NEW, CONTACTED, QUOTE_SENT, VISIT_SCHEDULED, CONTRACTED, LOST, ON_HOLD
  priority        Priority   @default(MEDIUM)     // LOW, MEDIUM, HIGH, URGENT

  // 팔로업
  currentSequenceStep Int    @default(0)          // 현재 팔로업 단계
  nextFollowupAt  DateTime?                       // 다음 팔로업 예정 시각
  sequenceActive  Boolean    @default(true)       // 시퀀스 진행 중 여부

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  activities      Activity[]
  messages        Message[]
}

model Activity {
  id        String       @id @default(cuid())
  leadId    String
  lead      Lead         @relation(fields: [leadId], references: [id])
  type      ActivityType                          // INQUIRY_RECEIVED, AUTO_REPLY_SENT, STAFF_NOTIFIED, CALL_MADE, QUOTE_SENT, FOLLOWUP_SENT, STATUS_CHANGED, NOTE_ADDED
  content   String                                // 활동 내용 설명
  metadata  Json?                                 // 추가 데이터
  createdAt DateTime     @default(now())
}

model Message {
  id          String        @id @default(cuid())
  leadId      String
  lead        Lead          @relation(fields: [leadId], references: [id])
  templateId  String?
  template    MessageTemplate? @relation(fields: [templateId], references: [id])
  type        MessageType                         // ALIMTALK, SMS, KAKAO
  content     String                              // 실제 발송된 내용
  status      MessageStatus @default(PENDING)     // PENDING, SENT, DELIVERED, FAILED
  sentAt      DateTime?
  solapiMsgId String?                             // Solapi 메시지 ID (추적용)
  createdAt   DateTime      @default(now())
}

model MessageTemplate {
  id          String   @id @default(cuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id])
  name        String                              // 템플릿 이름 (내부용)
  trigger     TemplateTrigger                     // AUTO_REPLY, QUOTE_SENT, FOLLOWUP_D3, FOLLOWUP_D7, FOLLOWUP_D14, CONTRACT_CONGRATS
  content     String                              // 템플릿 내용 (변수: {{name}}, {{date}}, {{staff_name}} 등)
  isActive    Boolean  @default(true)
  messages    Message[]
}

model FollowupSequence {
  id          String   @id @default(cuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id])
  name        String                              // 시퀀스 이름
  steps       Json                                // [{delayDays: 3, templateTrigger: "FOLLOWUP_D3"}, ...]
  isActive    Boolean  @default(true)
}

enum BusinessType {
  WEDDING_HALL
  STUDIO
  DRESS
  HONEYMOON
  INVITATION
}

enum LeadSource {
  INSTAGRAM_DM
  KAKAO
  NAVER_FORM
  WEBSITE
  PHONE
  OTHER
}

enum LeadStatus {
  NEW
  CONTACTED
  QUOTE_SENT
  VISIT_SCHEDULED
  CONTRACTED
  LOST
  ON_HOLD
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum ActivityType {
  INQUIRY_RECEIVED
  AUTO_REPLY_SENT
  STAFF_NOTIFIED
  CALL_MADE
  QUOTE_SENT
  FOLLOWUP_SENT
  VISIT_SCHEDULED
  STATUS_CHANGED
  NOTE_ADDED
}

enum MessageType {
  ALIMTALK
  SMS
  KAKAO
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}

enum TemplateTrigger {
  AUTO_REPLY
  QUOTE_SENT
  FOLLOWUP_D3
  FOLLOWUP_D7
  FOLLOWUP_D14
  CONTRACT_CONGRATS
  REVIEW_REQUEST
  CUSTOM
}
```

## 핵심 워크플로우 로직

### 1. 문의 수신 → 자동 처리 (`/api/webhooks/inquiry`)
```
문의 수신 (POST)
  → OpenAI로 파싱 (이름, 연락처, 날짜, 인원, 예산 추출)
  → Lead 생성 (status: NEW)
  → Activity 기록 (INQUIRY_RECEIVED)
  → 알림톡 자동 발송 (AUTO_REPLY 템플릿, 변수 치환)
  → Activity 기록 (AUTO_REPLY_SENT)
  → 담당자에게 Slack/카톡 알림
  → Activity 기록 (STAFF_NOTIFIED)
  → 팔로업 시퀀스 시작 (nextFollowupAt 설정)
```

### 2. 팔로업 크론 (`/api/cron/followup`, 매 30분 실행)
```
nextFollowupAt <= now() AND sequenceActive == true 인 리드 조회
  → 각 리드별:
    → 현재 시퀀스 단계의 템플릿으로 알림톡 발송
    → Activity 기록 (FOLLOWUP_SENT)
    → currentSequenceStep++
    → 다음 단계 있으면 nextFollowupAt 업데이트
    → 마지막 단계였으면 sequenceActive = false
```

### 3. 상태 변경 시 시퀀스 제어
```
상태가 CONTACTED, QUOTE_SENT, VISIT_SCHEDULED, CONTRACTED 로 변경되면
  → 해당 상태에 맞는 알림톡 발송 (있으면)
  → CONTRACTED 또는 LOST 이면 sequenceActive = false (팔로업 중단)
  → 고객이 중간에 응답하면 sequenceActive = false + 담당자 알림
```

## AI 파싱 프롬프트 (OpenAI)

```typescript
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
```

## 알림톡 발송 유틸 (Solapi)

```typescript
// lib/solapi.ts
import Solapi from 'solapi';

const solapi = new Solapi(process.env.SOLAPI_API_KEY!, process.env.SOLAPI_API_SECRET!);

export async function sendAlimtalk({
  to,
  templateId,
  variables,
}: {
  to: string;
  templateId: string;
  variables: Record<string, string>;
}) {
  // 템플릿 내 변수 치환: {{name}} → 실제 값
  // Solapi 알림톡 발송
  // 실패 시 SMS 폴백
}
```

## 디자인 시스템

### 컬러 팔레트
- **Primary (연두/민트)**: #A8D5BA (메인), #E8F5E9 (연한 배경), #66BB6A (액센트)
- **Secondary (웜 그레이)**: #F5F5F0 (배경), #E8E4DF (카드), #9E9E9E (보조 텍스트)
- **Text**: #2C2C2C (본문), #1B1B1B (제목), #FFFFFF (밝은 배경 위)
- **Accent (골드)**: #D4AF37 (CTA 버튼, 하이라이트)
- **대시보드 내부**: 화이트 베이스 + 연두 포인트. 깔끔하고 미니멀하게.

### 랜딩 페이지 (/) 연출
- **시네마틱 텍스트 애니메이션**: 메가박스 영화 시작 전처럼, 텍스트가 한 줄씩 페이드인+슬라이드업으로 등장
  - 1단계: "문의가 들어옵니다" (페이드인)
  - 2단계: "3초 만에 응답합니다" (슬라이드업)
  - 3단계: "계약으로 이어집니다" (스케일업)
  - 4단계: CTA 버튼 등장 "마리플로 시작하기"
- **배경**: 연두~민트 그라데이션 (#E8F5E9 → #A8D5BA) 또는 부드러운 보케 효과
- **폰트**: 제목은 크고 굵게 (Pretendard 또는 Noto Sans KR), 본문은 가볍게
- **전체 톤**: 산뜻하고 청량한 웨딩 느낌. 꽃, 반지 등 클리셰 이미지는 쓰지 않는다. 타이포그래피와 여백으로 고급감을 낸다.

### 애니메이션 가이드
- CSS animation 또는 framer-motion 사용
- 텍스트 등장: opacity 0→1 + translateY(20px→0) / duration 0.8s / ease-out
- 순차 등장: 각 텍스트 사이 0.6~1s delay
- 스크롤 시 섹션별 fade-in (Intersection Observer)
- 과하지 않게. 우아하고 절제된 모션.

## 코딩 규칙

### 일반
- 모든 코드와 주석은 영어로 작성한다. UI 텍스트와 사용자에게 보이는 문자열만 한국어.
- TypeScript strict mode 사용. any 타입 사용 금지.
- 서버 컴포넌트를 기본으로 사용하고, 인터랙션이 필요한 경우에만 "use client".
- API 라우트에서 에러 처리 필수 — try/catch + 적절한 HTTP 상태 코드.
- 환경 변수는 .env.local에 저장하고, 타입은 env.d.ts에 정의.

### 네이밍
- 컴포넌트: PascalCase (LeadKanban.tsx)
- 유틸/lib: camelCase (solapi.ts)
- API 라우트: kebab-case (/api/webhooks/inquiry)
- DB 컬럼: camelCase (Prisma 기본)
- 상수/Enum: UPPER_SNAKE_CASE

### 보안
- Solapi API 키, OpenAI API 키 등 민감 정보는 반드시 서버사이드에서만 사용.
- 공개 문의 폼 API는 rate limiting 적용 (upstash/ratelimit).
- 웹훅 엔드포인트는 시그니처 검증 필수.
- Business별 데이터 격리 (Row Level Security).

### UI/UX
- 한국어 UI. 전문 용어보다 쉬운 표현 사용 ("리드" → "문의 고객").
- 모바일 반응형 필수 — 웨딩플래너가 현장에서 폰으로 확인.
- 실시간 업데이트: Supabase Realtime으로 새 문의 알림.
- 로딩/에러 상태 항상 처리.

### 성능
- 리드 목록은 페이지네이션 적용 (커서 기반).
- 알림톡 발송은 큐 처리 (대량 발송 시 rate limit 준수).
- OpenAI API 호출은 캐싱 불필요 (매번 다른 문의).

## MVP 우선순위 (빌드 순서)

### Sprint 1: 기반 (1주)
1. Next.js + Supabase + Prisma 초기 세팅
2. Auth (회원가입/로그인)
3. Business 등록 페이지
4. DB 마이그레이션

### Sprint 2: 핵심 기능 (2주)
5. 공개 문의 폼 (/inquiry/[businessId])
6. 문의 수신 웹훅 + AI 파싱
7. Lead CRUD + 칸반 보드
8. 알림톡 자동 발송 (Solapi 연동)

### Sprint 3: 자동화 (1주)
9. 팔로업 시퀀스 설정 UI
10. 팔로업 크론 잡
11. 담당자 Slack/카톡 알림

### Sprint 4: 리포팅 (1주)
12. 리드별 활동 타임라인
13. 대시보드 KPI (신규 문의, 전환율, 응답 시간)
14. 주간 리포트 자동 생성 + 발송

## 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Solapi
SOLAPI_API_KEY=
SOLAPI_API_SECRET=

# Google Calendar (선택)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

# Slack (선택)
SLACK_WEBHOOK_URL=

# App
NEXT_PUBLIC_APP_URL=              # https://mariflo.kr (프로덕션)
CRON_SECRET=                    # Vercel Cron 인증용
```

## 참고 사항

- 이 프로젝트는 한국 웨딩 시장을 타겟으로 한 B2B SaaS이다.
- 카카오 알림톡은 사전 등록된 템플릿만 발송 가능하므로, 템플릿 관리가 중요하다.
- AI는 고객과 직접 대화하지 않는다. 문의 파싱과 데이터 구조화에만 사용한다.
- 웨딩홀 → 스튜디오 → 드레스 → 허니문 순으로 확장 예정이며, BusinessType enum으로 관리한다.
- 첫 고객은 강남/논현 웨딩홀을 타겟으로 하며, 파일럿 기간에는 직접 모니터링하며 워크플로우를 최적화한다.
