# Mariflo 바이브코딩 프롬프트 가이드

## 사전 준비 (프롬프트 치기 전에)

```
프로젝트 폴더 구조 확인:
mariflo/
├── claude.md          ✅ (프로젝트 설정 파일)
├── docs/
│   ├── wedding_hall_research.xlsx   ✅ (시장 리서치)
│   └── wedding_ai_roadmap.docx     ✅ (로드맵)
└── (아직 코드 없음)
```

---

## 프롬프트 1: 프로젝트 초기 세팅 + 랜딩 페이지

```
claude.md를 읽고 Mariflo 프로젝트를 초기 세팅해줘.

Sprint 1의 첫 단계야:
1. Next.js 14 App Router + TypeScript 프로젝트 생성
2. Supabase 연동 설정 (환경변수 템플릿 포함)
3. Prisma 설치 + claude.md에 정의된 DB 스키마 전체 적용
4. Tailwind CSS + shadcn/ui 설치 및 설정
5. 프로젝트 구조를 claude.md의 src/ 구조대로 폴더 생성
6. .env.example 파일 생성 (필요한 환경변수 목록)
7. framer-motion 설치

그리고 랜딩 페이지 (app/page.tsx)를 먼저 만들어줘.
claude.md의 "디자인 시스템" 섹션을 참고해서:

- 배경: 연두~민트 그라데이션 (#E8F5E9 → #A8D5BA)
- 시네마틱 텍스트 애니메이션 (framer-motion 사용):
  - 화면 중앙에서 텍스트가 한 줄씩 순차적으로 등장
  - 1줄: "문의가 들어옵니다" → 페이드인 + 살짝 위로 슬라이드
  - (0.8초 후)
  - 2줄: "3초 만에 응답합니다" → 같은 효과
  - (0.8초 후)  
  - 3줄: "계약으로 이어집니다" → 약간 스케일업 효과
  - (1초 후)
  - "마리플로 시작하기" CTA 버튼 등장 (골드 #D4AF37 배경)
- 메가박스 영화 시작 전 자막 느낌으로, 우아하고 절제된 모션
- 폰트는 Pretendard. 제목 텍스트는 크고 굵게.
- 꽃이나 반지 같은 웨딩 클리셰 이미지 없이, 타이포그래피와 여백만으로 고급감
- 모바일 반응형

아직 Auth나 다른 기능은 구현하지 말고, 뼈대 + 이 랜딩 페이지만 완성해줘.
```

---

## 프롬프트 2: Auth + Business 등록

```
Sprint 1 계속.

1. Supabase Auth 설정 (매직링크 로그인)
   - /login 페이지: 이메일 입력 → 매직링크 발송
   - /signup 페이지: 업체 등록 (업체명, 업종 선택, 전화번호, 이메일)
   - 로그인 후 /dashboard로 리다이렉트
   - middleware.ts에서 미인증 사용자 /login으로 리다이렉트

2. Business 등록 플로우
   - 회원가입 시 Business 레코드 자동 생성
   - 업종 선택: 웨딩홀, 스튜디오, 드레스, 허니문, 청첩장
   - 등록 완료 후 대시보드로 이동

UI는 한국어로, 모바일 반응형으로 만들어줘.
```

---

## 프롬프트 3: 대시보드 레이아웃 + 리드 칸반

```
대시보드를 만들어줘.

1. 레이아웃 (/(dashboard)/layout.tsx)
   - 왼쪽 사이드바: 로고(마리플로), 메뉴(대시보드, 문의고객, 메시지, 일정, 설정)
   - 모바일에서는 하단 탭바로 전환
   - 상단에 업체명 표시

2. 메인 대시보드 (/(dashboard)/page.tsx)
   - 오늘의 요약 카드 4개: 신규 문의, 상담 중, 견적 발송, 이번 달 계약
   - 각 카드는 Supabase에서 Lead 테이블 집계

3. 리드 칸반보드 (/(dashboard)/leads/page.tsx)
   - 컬럼: 신규 → 상담중 → 견적발송 → 방문예약 → 계약완료
   - 드래그앤드롭으로 상태 변경
   - 각 카드에: 고객명, 희망 날짜, 예상 인원, 문의 경과 시간
   - 카드 클릭 → /leads/[id] 상세 페이지

디자인은 깔끔하고 모던하게. claude.md의 디자인 시스템 참고해서
화이트 베이스 + 연두 포인트 색상. 대시보드는 산뜻하되 과하지 않게.
```

---

## 프롬프트 4: 공개 문의 폼 + AI 파싱

```
핵심 기능 구현. 외부 문의가 들어오는 진입점을 만들어줘.

1. 공개 문의 폼 (/inquiry/[businessId]/page.tsx)
   - 누구나 접근 가능 (로그인 불필요)
   - 입력 필드: 이름, 연락처, 희망 날짜, 예상 인원, 문의 내용 (자유 텍스트)
   - 제출 시 /api/webhooks/inquiry로 POST
   - 제출 완료 화면: "문의가 접수되었습니다! 담당 플래너가 곧 연락드릴게요 😊"
   - 모바일 최적화 (예비 신부가 폰에서 작성)

2. 문의 수신 API (/api/webhooks/inquiry/route.ts)
   - 문의 데이터 수신
   - OpenAI GPT-4o-mini로 파싱 (claude.md의 PARSE_PROMPT 사용)
   - Lead 레코드 생성 (status: NEW)
   - Activity 기록 (INQUIRY_RECEIVED)
   - 응답: { success: true, leadId: "..." }

3. AI 파싱 유틸 (lib/openai.ts)
   - claude.md에 정의된 프롬프트로 문의 내용 분석
   - 이름, 연락처, 희망 날짜, 인원, 예산, 긴급도 추출
   - JSON 파싱 실패 시 안전한 폴백 처리

OpenAI API 키는 .env.local에서 읽어오게 해줘.
```

---

## 프롬프트 5: 알림톡 자동 발송 + 담당자 알림

```
문의가 들어오면 자동으로 동작하는 부분을 구현해줘.

1. Solapi 알림톡 유틸 (lib/solapi.ts)
   - Solapi npm 패키지 사용
   - sendAlimtalk 함수: to, templateId, variables 받아서 발송
   - 발송 실패 시 SMS 폴백
   - 발송 결과를 Message 테이블에 기록

2. 자동 응답 로직 (/api/webhooks/inquiry에 추가)
   - Lead 생성 후 즉시:
     a. 고객에게 알림톡 발송 (AUTO_REPLY 템플릿)
     b. Activity 기록 (AUTO_REPLY_SENT)
     c. 담당자에게 Slack Webhook 알림 (lib/slack.ts)
     d. Activity 기록 (STAFF_NOTIFIED)
     e. 팔로업 시퀀스 시작 (nextFollowupAt 설정)

3. Slack 알림 유틸 (lib/slack.ts)
   - Webhook URL로 메시지 발송
   - 포맷: "🔔 신규 문의 | 김XX | 6월 | 100명 | 010-XXXX"

4. 알림톡 발송은 실제 Solapi API가 없어도 동작하도록
   SOLAPI_API_KEY가 없으면 console.log로 대체하는 개발 모드 만들어줘.
```

---

## 프롬프트 6: 팔로업 시퀀스 + 크론

```
자동 팔로업 시스템을 구현해줘.

1. 팔로업 시퀀스 설정 UI (/(dashboard)/sequences/page.tsx)
   - 기본 시퀀스: D+3, D+7, D+14 팔로업
   - 각 단계별 메시지 템플릿 선택
   - 단계 추가/삭제/순서 변경 가능
   - 시퀀스 활성화/비활성화 토글

2. 팔로업 크론 잡 (/api/cron/followup/route.ts)
   - Vercel Cron으로 매 30분 실행 (vercel.json에 cron 설정 추가)
   - CRON_SECRET 헤더 검증
   - nextFollowupAt <= now() AND sequenceActive == true 인 리드 조회
   - 각 리드에 대해:
     a. 해당 단계 템플릿으로 알림톡 발송
     b. Activity 기록
     c. currentSequenceStep++
     d. 다음 단계 있으면 nextFollowupAt 업데이트
     e. 마지막 단계면 sequenceActive = false

3. 상태 변경 시 시퀀스 제어
   - CONTRACTED 또는 LOST → sequenceActive = false
   - 고객 응답 시 → sequenceActive = false + 담당자 알림
```

---

## 프롬프트 7: 리포트 + 마무리

```
마지막 Sprint. 리포팅과 마무리 작업.

1. 리드 상세 페이지 (/(dashboard)/leads/[id]/page.tsx)
   - 고객 정보 카드 (이름, 연락처, 희망 날짜, 인원, 예산)
   - 활동 타임라인 (Activity 테이블 시간순 표시)
   - 상태 변경 버튼 (드롭다운)
   - 메모 추가 기능
   - 발송된 메시지 이력

2. 대시보드 KPI (/(dashboard)/page.tsx 보강)
   - 이번 주/이번 달 전환율 (계약 / 전체 문의)
   - 평균 응답 시간
   - 팔로업 중인 리드 수
   - 놓친 팔로업 경고 (⚠️)

3. 주간 리포트 (/api/cron/report/route.ts)
   - 매주 월요일 09:00 실행
   - "이번 주: 문의 23건, 상담 18건, 견적 15건, 계약 4건 (17.4%)"
   - 업체 대표에게 알림톡으로 발송

4. 전체 점검
   - 모든 페이지 모바일 반응형 확인
   - 에러 처리 누락된 곳 보완
   - README.md 작성 (설치 방법, 환경변수 설정, 배포 방법)
```

---

## 💡 프롬프트 사용 팁

### 에러가 나면
```
이 에러 고쳐줘: [에러 메시지 붙여넣기]
```

### 디자인이 마음에 안 들면
```
대시보드 디자인을 더 세련되게 바꿔줘.
- 카드에 그림자 추가
- 숫자는 크게, 라벨은 작게
- 전환율은 초록/빨강으로 색상 표시
```

### 기능 추가하고 싶으면
```
리드 목록에 검색 기능 추가해줘.
- 고객명, 연락처로 검색
- 상태별 필터
- 날짜 범위 필터
```

### 배포할 때
```
Vercel에 배포할 수 있게 설정해줘.
- vercel.json 설정
- 환경변수 목록 정리
- Supabase 프로덕션 설정 가이드
```
