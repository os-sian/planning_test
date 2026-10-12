# 프렙 카페 · EPIC 1

이번 구현 범위는 본인 로그인, 제공 자료 판매 조회, 판매 등록·수정·삭제입니다. EPIC 2·3의 화면은 아직 만들지 않았습니다. 판매 저장에 필요한 재료 사용·재고·집계 검증 기반은 포함합니다.

## 로컬 검사 시작

사용자가 승인한 검사 환경은 컴퓨터 안의 실제 PostgreSQL 엔진(PGlite)과 비밀번호 로그인입니다. 원본 JSON·엑셀은 바뀌지 않습니다. 기록은 `.local/database`에 보존되며 브라우저를 닫아도 남습니다. 운영 Supabase 인증·클라우드 저장을 검사했다고 간주하지 않습니다.

Node.js 24에서 다음 명령을 실행합니다.

```sh
npm install
npm run setup:local
npm run dev
```

`http://127.0.0.1:3000`에서 열립니다. 로그인 이메일·임의 생성 비밀번호는 `.local/로그인정보.txt`에 있습니다. 로컬 모드는 이 컴퓨터에서만 사용하고 Vercel에는 배포하지 않습니다. `setup:local` 재실행은 기존 매장 기록을 다시 추가하지 않으며 비밀번호도 바꾸지 않습니다. 개발 서버를 끈 상태에서 실행하세요.

검사 명령: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`. 브라우저 검사는 개발 서버와 Playwright Chromium이 필요합니다.

## Supabase 연결 준비

1. 본인 Supabase 계정에서 서울 지역 프로젝트를 만듭니다. Auth에서 본인 이메일 계정 하나만 생성하고 공개 가입·익명 로그인을 끕니다. 본인 비밀번호를 코드나 채팅에 넣지 않습니다.
2. `.env.example`의 운영 변수를 `.env.local`에 채웁니다. `OWNER_USER_ID`는 Auth 본인 ID, `SUPABASE_PUBLISHABLE_KEY`는 공개 인증 키입니다. DB 서버 인증서는 관리자 화면에서 내려받아 `DATABASE_CA_CERT`에 설정합니다.
3. 최초 초기화에만 관리자 연결 `MIGRATION_DATABASE_URL`을 설정하고 `npm run db:setup`을 실행합니다. 기존 매장 자료가 있으면 다시 넣지 않습니다. 초기 자료가 정상인지 전부 검사한 뒤 한 번에 반영합니다.
4. DB에서 `ledger_runtime` 역할에 로그인 권한과 별도 비밀번호를 지정합니다. 이 역할에는 표 구조 변경·RLS 우회 권한을 주지 않습니다. Vercel 웹 서버의 `DATABASE_URL`은 이 제한 역할의 transaction pooler 접속 주소를 사용합니다. 준비용 관리자 접속 값은 Vercel 웹 환경에 넣지 않습니다.
5. `APP_MODE=supabase`와 운영 주소·본인 ID를 설정하고 로그인·DB 권한·판매 저장·로그아웃을 다시 검사합니다. 운영에서 인증이 설정되지 않으면 연결 설정 안내만 보여 주고 기록을 공개하지 않습니다.

코드는 [os-sian/planning_test](https://github.com/os-sian/planning_test)의 main 브랜치에 보관했습니다. 현재 Supabase·Vercel 외부 계정은 연결하지 않았습니다. 실제 연결은 별도 확인과 검사가 필요하며 로컬 테스트 통과만으로 운영 배포 완료를 표시하지 않습니다.

## 기록과 보안

가상 자료는 초기화할 때만 읽고 매번 다시 덮어쓰지 않습니다. 원기록은 DB에, 당시 원가와 정확한 분수 보조값도 함께 저장합니다. 같은 날짜·메뉴·채널은 중복 등록할 수 없습니다. 저장 요청 번호·행 버전·복원 세대 검사로 중복 적용과 오래된 수정도 막습니다. 실패한 변경은 전부 취소합니다.

개인 연결 설정·로그인 비밀번호·로컬 DB·검사 로그는 GitHub 보관 대상에서 제외합니다. 이후 EPIC는 사용자가 승인한 EPIC 1 완료 뒤에 진행합니다.
