# Mariflo 기능 명세서

> 현재까지 구현된 모든 기능을 정리한 문서입니다.

---

## 1. 랜딩 페이지 (`/`)

서비스 첫 화면. 시네마틱 Split-Flap 타일 애니메이션으로 "MARIFLO" 로고가 등장한다.

- **애니메이션 4단계**: 랜덤 문자 스크램블 → 파동 효과 → 최종 글자 공개 → 잔잔한 부유 모션
- framer-motion 기반, 민트(#A8D5BA) + 골드(#D4AF37) 컬러 팔레트
- 반응형 대응 (모바일/데스크톱)
- 하단 "시작하기" CTA 버튼 → `/signup` 이동

**파일**: `src/app/page.tsx`

---

## 2. 인증 (Auth)

Supabase Auth 기반 매직링크 로그인.

### 2-1. 회원가입 (`/signup`)

업체 등록 + 매직링크 발송을 동시에 처리.

- 입력 필드: 업체명, 업종(드롭다운), 전화번호, 이메일
- 업종: 웨딩홀 / 스튜디오 / 드레스 / 허니문 / 청첩장
- 제출 시 → `POST /api/signup` 호출 → DB에 Business 레코드 생성 + 매직링크 이메일 발송
- 발송 완료 안내 UI

**파일**: `src/app/(auth)/signup/page.tsx`, `src/app/api/signup/route.ts`

### 2-2. 로그인 (`/login`)

- 이메일 입력 → Supabase OTP 매직링크 발송
- 로그인 후 대시보드로 리다이렉트

**파일**: `src/app/(auth)/login/page.tsx`

### 2-3. Auth Callback (`/api/auth/callback`)

- 매직링크 클릭 시 OTP 코드 교환 → 세션 생성 → 대시보드 리다이렉트

**파일**: `src/app/api/auth/callback/route.ts`

### 2-4. 미들웨어

- 모든 요청에서 Supabase 세션 자동 갱신
- 비로그인 사용자가 `/dashboard` 접근 시 `/login`으로 리다이렉트

**파일**: `src/middleware.ts`

---

## 3. 대시보드

로그인 후 진입하는 메인 작업 공간. 사이드바 + 메인 콘텐츠 레이아웃.

### 3-1. 사이드바

- **데스크톱**: 왼쪽 고정 사이드바 (너비 256px)
  - 로고(MARIFLO), 업체명 표시
  - 네비게이션: 대시보드, 문의 고객, 메시지, 일정, 설정, 메시지 템플릿, 자동 팔로업, 리포트
  - 현재 페이지 하이라이트
  - 하단: 이메일 표시 + 로그아웃 버튼
- **모바일**: 하단 탭 바 (대시보드, 문의 고객, 메시지, 일정, 설정)

**파일**: `src/components/dashboard/Sidebar.tsx`, `src/app/dashboard/layout.tsx`

### 3-2. 메인 대시보드 (`/dashboard`)

오늘의 현황 요약 페이지. 서버 컴포넌트.

- **KPI 카드 4개**: 오늘 신규 문의 / 상담 중 / 견적 발송 / 이번 달 계약 (골드 하이라이트)
- **온보딩 체크리스트**: 업체 등록, API 키 설정, 템플릿 등록, 팔로업 시퀀스 설정, 문의 폼 링크 추가 — 완료 여부에 따라 체크 표시

**파일**: `src/app/dashboard/page.tsx`

### 3-3. 문의 고객 — 칸반 보드 (`/dashboard/leads`)

리드를 상태별 칸반 보드로 관리.

- **5개 컬럼**: 신규 → 상담중 → 견적발송 → 방문예약 → 계약완료
- 각 컬럼에 리드 수 표시
- **드래그 앤 드롭** (dnd-kit): 카드를 다른 컬럼으로 드래그하면 상태 자동 변경
  - 낙관적 업데이트 + 실패 시 롤백
  - `PATCH /api/leads/[id]` 호출
- **리드 카드**: 고객명, 경과 시간, 희망 날짜, 인원, 담당자 표시
- 카드 클릭 → 리드 상세 페이지 이동
- 빈 상태 처리

**파일**: `src/app/dashboard/leads/page.tsx`, `src/components/dashboard/LeadKanban.tsx`

### 3-4. 리드 상세 (`/dashboard/leads/[id]`)

개별 리드의 전체 정보 + 활동 이력을 보는 페이지.

- **고객 정보 카드**: 연락처, 이메일, 유입 경로, 희망 날짜, 예상 인원, 예산, 우선순위, 담당자
- **상태 변경**: 7개 상태 버튼 (신규 문의 ~ 보류) — 클릭으로 즉시 변경, `PATCH /api/leads/[id]` 호출
  - 상태 변경 시 Activity(STATUS_CHANGED) 자동 기록
- **메모 추가**: 텍스트 입력 → `POST /api/leads/[id]/notes` → Activity(NOTE_ADDED) 생성 후 타임라인에 즉시 반영
- **활동 타임라인**: 모든 Activity를 시간순(최신 먼저)으로 표시
  - 유형별 컬러 도트 (접수=민트, 자동응답=초록, 알림=그레이, 견적=골드 등)
  - 시간 표시 (월/일 시:분)
- **발송 메시지 이력**: Message 목록, 유형(알림톡/SMS/카카오) + 상태 뱃지(대기/발송/전달/실패)
- **원본 문의 내용**: rawInquiry 전문 표시

**파일**: `src/app/dashboard/leads/[id]/page.tsx`, `src/components/dashboard/LeadDetailClient.tsx`, `src/app/api/leads/[id]/route.ts` (GET+PATCH), `src/app/api/leads/[id]/notes/route.ts`

### 3-5. 메시지 이력 (`/dashboard/messages`)

전체 알림톡/메시지 발송 내역 조회.

- **상태별 카운트 필터**: 전체 / 대기 중 / 발송 완료 / 전달 완료 / 발송 실패
- **반응형 테이블**: 수신자, 내용(말줄임), 유형, 상태 뱃지, 발송 시각
  - 상태 뱃지 색상: 전달=초록, 발송=파랑, 실패=빨강, 대기=회색
- 빈 상태 처리

**파일**: `src/app/dashboard/messages/page.tsx`, `src/app/api/messages/route.ts`

### 3-6. 일정 캘린더 (`/dashboard/calendar`)

리드의 희망 날짜(desiredDate) 기반 월간 캘린더.

- **월 네비게이션**: 좌우 화살표로 이전/다음 달 이동
- **CSS Grid 캘린더**: 요일 헤더(일~토) + 날짜 셀
  - 오늘 날짜 하이라이트 (검정 원)
  - 해당 날짜에 리드가 있으면 건수 뱃지(민트색) 표시
  - 날짜 클릭 시 선택 상태 표시(민트 배경)
- **사이드 패널**: 선택한 날짜의 리드 목록
  - 고객명, 상태 뱃지, 연락처, 인원 표시
  - 클릭 시 리드 상세 페이지로 이동

**파일**: `src/app/dashboard/calendar/page.tsx`, `src/components/dashboard/CalendarView.tsx`

### 3-7. 설정 (`/dashboard/settings`)

업체 정보 확인 + API 연동 관리 페이지. 클라이언트 컴포넌트.

- **업체 정보 (읽기 전용)**: 업체명, 업종, 전화번호, 이메일
- **API 연동 (수정 가능)**:
  - Solapi API Key / Secret — 마스킹 표시, 변경 시 새 값 입력
  - Slack Webhook URL
  - 저장 버튼 → `PATCH /api/settings`
- **문의 폼 링크**: `/inquiry/{businessId}` URL 표시 + 클립보드 복사 버튼

**파일**: `src/app/dashboard/settings/page.tsx`, `src/app/api/settings/route.ts` (GET+PATCH)

### 3-8. 리포트 (`/dashboard/reports`)

문의 현황과 전환 성과를 한눈에 보는 페이지. 서버 컴포넌트.

- **이번 주 KPI (5개 카드)**: 신규 문의(민트) / 상담 전환(그레이) / 견적 발송(블랙) / 계약 완료(골드) / 이탈(레드)
- **이번 달 요약 (4개 카드)**: 신규 문의 / 계약 완료 / 이탈 / 전환율(%)
- **유입 경로별 분포**: 프로그레스 바 차트 (인스타, 카카오, 네이버 등)
- **상태별 분포**: 프로그레스 바 차트 (신규 ~ 이탈)
- **최근 계약 리스트**: 최근 5건, 고객명/연락처/희망일/인원/계약일 — 클릭 시 상세 페이지 이동

**파일**: `src/app/dashboard/reports/page.tsx`

### 3-9. 메시지 템플릿 (`/dashboard/templates`)

알림톡 템플릿 관리 페이지.

- 템플릿 목록 (트리거 유형별 그룹핑)
- 트리거 유형: 자동 응답 / 견적 발송 / 3일 후 팔로업 / 7일 후 / 14일 후 / 계약 축하 / 후기 요청 / 커스텀
- 생성/수정/삭제 (Dialog 모달)
- 변수 삽입 버튼 (`{{name}}`, `{{date}}`, `{{staff_name}}` 등)
- 활성/비활성 토글

**파일**: `src/app/dashboard/templates/page.tsx`, `src/app/api/templates/route.ts` (GET/POST/PATCH/DELETE)

### 3-10. 자동 팔로업 시퀀스 (`/dashboard/sequences`)

팔로업 메시지 자동 발송 스케줄 설정 페이지.

- 시퀀스 목록 (업체당 1개만 활성)
- 멀티 스텝 편집기: 각 단계별 대기 일수(delayDays) + 템플릿 트리거 지정
- 단계 추가/삭제/
순서 변경
- 활성/비활성 토글

**파일**: `src/app/dashboard/sequences/page.tsx`, `src/app/api/sequences/route.ts` (GET/POST/PATCH/DELETE)

---

## 4. 공개 문의 폼 (`/inquiry/[businessId]`)

외부 고객이 접근하는 공개 페이지. 로그인 불필요.

- **입력 필드**: 이름, 연락처, 희망 날짜, 예상 인원, 문의 내용
- 제출 → `POST /api/webhooks/inquiry` 호출
- 제출 완료 시 확인 메시지 표시
- 업체별 URL: `/inquiry/{businessId}` (설정 페이지에서 링크 복사 가능)

**파일**: `src/app/inquiry/[businessId]/page.tsx`, `src/components/forms/InquiryForm.tsx`

---

## 5. 핵심 백엔드 로직

### 5-1. 문의 수신 웹훅 (`POST /api/webhooks/inquiry`)

외부 문의가 들어왔을 때 실행되는 전체 자동화 파이프라인:

1. 문의 데이터 수신
2. **OpenAI(GPT-4o-mini)로 파싱** — 이름, 연락처, 희망 날짜, 인원, 예산, 긴급도 추출
3. **Lead 레코드 생성** (status: NEW)
4. Activity 기록 (INQUIRY_RECEIVED)
5. **알림톡 자동 발송** (AUTO_REPLY 템플릿, 변수 치환) — Solapi 연동
6. Activity 기록 (AUTO_REPLY_SENT)
7. **담당자 Slack 알림** 발송
8. Activity 기록 (STAFF_NOTIFIED)
9. 팔로업 시퀀스 시작 (nextFollowupAt 설정)

**파일**: `src/app/api/webhooks/inquiry/route.ts`

### 5-2. 팔로업 크론 (`GET /api/cron/followup`)

30분 간격으로 Vercel Cron이 호출. (`vercel.json`에 스케줄 등록)

1. `nextFollowupAt <= now()` AND `sequenceActive == true`인 리드 조회
2. 각 리드별로 현재 시퀀스 단계의 템플릿으로 알림톡 발송
3. Activity 기록 (FOLLOWUP_SENT)
4. `currentSequenceStep++` → 다음 단계가 있으면 nextFollowupAt 업데이트
5. 마지막 단계였으면 `sequenceActive = false`

**파일**: `src/app/api/cron/followup/route.ts`

### 5-2b. 주간 리포트 크론 (`GET /api/cron/report`)

매주 월요일 00:00 UTC (09:00 KST) Vercel Cron이 호출.

1. 모든 업체별로 지난 주 KPI 집계 (신규/상담/견적/계약/이탈/전환율)
2. 활동 없는 업체는 스킵
3. 알림톡 발송 (SOLAPI_WEEKLY_REPORT_TEMPLATE_ID 필요)
4. Slack Webhook으로도 리포트 전송 (설정된 경우)
5. 개발 모드에서는 console.log 출력

**파일**: `src/app/api/cron/report/route.ts`

### 5-2c. Solapi 배달 상태 콜백 (`POST /api/webhooks/solapi`)

Solapi에서 메시지 배달 결과를 콜백으로 수신.

- 단건/배열 모두 처리
- `solapiMsgId`로 Message 레코드 매칭 후 상태 업데이트
- 상태코드 매핑: 2000 → DELIVERED, 3xxx → SENT, 4xxx → FAILED

**파일**: `src/app/api/webhooks/solapi/route.ts`

### 5-3. 리드 CRUD (`/api/leads`, `/api/leads/[id]`)

- `GET /api/leads` — 업체의 전체 리드 목록 (담당자 포함)
- `GET /api/leads/[id]` — 리드 상세 (활동 + 메시지 포함)
- `PATCH /api/leads/[id]` — 상태 변경 등 업데이트 + 상태 변경 시 Activity 자동 기록

### 5-4. 메모 추가 (`POST /api/leads/[id]/notes`)

- 리드에 메모 추가 → Activity(NOTE_ADDED) 생성

### 5-5. 메시지 목록 (`GET /api/messages`)

- 업체의 전체 메시지 이력 (수신자 이름/연락처 포함)

### 5-6. 설정 (`/api/settings`)

- `GET` — 업체 정보 조회 (API 키는 마스킹)
- `PATCH` — Solapi 키, Slack Webhook 업데이트 (허용 필드만)

---

## 6. 외부 서비스 연동 유틸

| 유틸 | 파일 | 기능 |
|------|------|------|
| **OpenAI** | `src/lib/openai.ts` | 문의 텍스트 → 구조화 데이터 파싱 (GPT-4o-mini) |
| **Solapi** | `src/lib/solapi.ts` | 카카오 알림톡 발송 + SMS 폴백, 전화번호 정규화, 개발 모드 로깅 |
| **Slack** | `src/lib/slack.ts` | 신규 문의 알림 Webhook 발송 (고객 정보 마스킹) |

---

## 7. 인프라 & 공통

| 항목 | 설명 |
|------|------|
| **DB** | Supabase PostgreSQL + Prisma 7 ORM (adapter: `@prisma/adapter-pg`) |
| **인증** | Supabase Auth 매직링크 |
| **미들웨어** | 세션 갱신 + 비인증 사용자 리다이렉트 |
| **UI 프레임워크** | Tailwind CSS v4 + shadcn/ui (button, input, label, card, select, dialog, switch, badge, textarea) |
| **상태 관리** | 서버 컴포넌트 기본 + 클라이언트 인터랙션 시 useState/useRouter |
| **Rate Limiting** | `@upstash/ratelimit` — 공개 문의 폼 API IP당 5req/60s, Upstash Redis 기반 |
| **크론** | Vercel Cron — 팔로업(30분), 주간 리포트(매주 월 00:00 UTC) |
| **에러 처리** | `dashboard/error.tsx` 에러 바운더리 + `dashboard/loading.tsx` 스켈레톤 |
| **상수/라벨** | `src/lib/constants.ts` — 리드 상태, 유입 경로, 우선순위, 활동 유형, 메시지 상태 등 한국어 라벨 |
| **타입** | `src/types/index.ts` — Prisma 생성 모델 + enum 재export |
| **폰트** | Pretendard(본문), Playfair Display(영문 세리프), Montserrat(로고) |

---

## 8. 전체 라우트 맵

```
/                              랜딩 페이지
/login                         로그인
/signup                        회원가입 (업체 등록)
/inquiry/[businessId]          공개 문의 폼

/dashboard                     메인 대시보드
/dashboard/leads               문의 고객 칸반 보드
/dashboard/leads/[id]          리드 상세 + 타임라인
/dashboard/messages            메시지 발송 이력
/dashboard/calendar            일정 캘린더
/dashboard/settings            업체 설정
/dashboard/reports             리포트
/dashboard/templates           메시지 템플릿 관리
/dashboard/sequences           자동 팔로업 시퀀스

/api/auth/callback             Auth 콜백
/api/signup                    회원가입 API
/api/leads                     리드 목록
/api/leads/[id]                리드 상세/수정
/api/leads/[id]/notes          메모 추가
/api/messages                  메시지 목록
/api/settings                  설정 조회/수정
/api/templates                 템플릿 CRUD
/api/sequences                 시퀀스 CRUD
/api/webhooks/inquiry          문의 수신 웹훅 (rate limiting 적용)
/api/webhooks/solapi           Solapi 배달 상태 콜백
/api/cron/followup             팔로업 크론 (30분 간격)
/api/cron/report               주간 리포트 크론 (매주 월 09:00 KST)
```
