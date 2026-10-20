# 운영 DB 를 Supabase(무료)로 옮기기 (2026-10-20) — 완료

> **완료 기록 (10-20 09:19)**: Neon 을 잠깐 Launch 로 바꿔 덤프 → 버셀 Storage 의 Supabase 연동으로 만든 `unnienote-db`(ref `zkczyacjdxkrlsdzchrr`, 싱가포르, 무료)에 복원(표 23개 행 수 일치) → GitHub `DATABASE_URL`=세션 풀러, 버셀 운영 `DATABASE_URL`=트랜잭션 풀러(Neon 프로젝트 연결 해제 뒤 직접 등록) → 재배포 성공, 파이프라인 성공 → Neon 다시 Free. Supabase 는 자체 인증기관 인증서를 써서 `packages/db/src/tls.ts` 가 그 루트 인증서로 TLS 를 검증한다. 처음 계획(supabase.com 별도 가입)은 가입 보안문자 때문에 쓰지 않았다. 옛 Neon(`neon-violet-book`) 데이터는 되돌리기용으로 남아 있다(무료, 연결 해제됨).

## 왜

- Neon 무료는 컴퓨트 시간(월 100 CU-시간)을 다 쓰면 다음 달까지 **DB 전체가 멈춘다**(10-19 실제로 멈춤).
- Supabase 무료는 컴퓨트 시간 한도가 없다(항상 켜진 작은 DB). 한도는 저장 500 MB·전송 5 GB/월·7일 동안 쓰지 않으면 일시정지(파이프라인이 2시간마다 쓰므로 해당 없음). 지금 DB 는 수십 MB.
- 계정: 별도 supabase.com 가입 없이 버셀 팀 Storage 의 Supabase 연동(로그인 = 버셀 계정 holicreact@plingcast.com). 브리디 Supabase(서울 `pqvayhabtayjfpklhxxj`)와 별개.

## 막힌 점

- **운영 데이터는 Neon 에 있고, Neon 이 멈춰 있어 꺼낼 수 없다**(글 606편 — 로컬 DB 는 112편뿐이라 대신할 수 없다).
- 꺼내는 길: ① Neon 을 잠깐 유료(Launch, 최소 요금 없음)로 바꿔 10분 덤프 → 바로 무료로 되돌림(비용 수십 원) ② 11월 1일 무렵 무료 초기화를 기다림(그때까지 사이트 새 글·배포 막힘).

## 순서 (덤프가 가능해진 뒤 약 15분)

1. Supabase 프로젝트 `unnienote`(지역 Singapore `ap-southeast-1`, Vercel 함수 sin1 과 같은 곳). DB 비밀번호는 키체인 `unnienote-supabase-db`.
2. 연결 주소 두 개를 받는다(Supabase → Connect):
   - 웹(Vercel 함수): **트랜잭션 풀러** `…pooler.supabase.com:6543/postgres` — 함수가 짧게 여러 번 붙는다. Prisma `PrismaPg` 어댑터는 이름 없는 문장만 써서 트랜잭션 풀러와 맞는다.
   - 파이프라인·마이그레이션: **세션 풀러** `…pooler.supabase.com:5432/postgres`(IPv4, GitHub Actions 에서 붙음. direct 는 IPv6 전용이라 Actions 에서 안 붙는다).
3. `SRC_URL=<Neon unpooled> DST_URL=<세션 풀러> sh scripts/db-move.sh` — 빈 DB 확인 → 덤프 → 복원 → 행 수 비교.
4. 주소 바꾸기:
   - GitHub: `gh secret set DATABASE_URL -R ytw418/nextneonews` ← 세션 풀러.
   - Vercel 운영 `DATABASE_URL` ← 트랜잭션 풀러. 지금은 Neon 연동이 주입하는 값이라, 프로젝트에서 Neon 스토어 연결을 끊은 뒤 직접 넣는다(Storage → neon-violet-book → Projects → hallyu-brief → Disconnect, 그다음 Settings → Environment Variables).
5. 재배포 → `gh workflow run pipeline` 1번 → 체크리스트(`DEPLOY-CHECKLIST.md`) 3번 확인.
6. 이틀 지켜본 뒤 Neon 은 무료로 되돌리고(유료로 바꿨다면) 프로젝트를 지운다. 덤프 파일은 `.local/db-move/` 에 남는다.

## 되돌리기

- Vercel·GitHub 의 `DATABASE_URL` 을 Neon 주소로 되돌리고 재배포. Neon 데이터는 지우기 전까지 그대로 있다.
