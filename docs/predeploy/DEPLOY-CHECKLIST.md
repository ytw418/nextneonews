# 운영 배포 체크리스트 (dev → main, 2026-10-20)

순서대로 한다. 막히면 그 단계에서 멈춘다.

## 0. 먼저 — 운영 DB 살리기 → 10-20 Supabase 무료로 이전 완료(`SUPABASE-MIGRATION.md`)

- [x] Vercel → Storage → `neon-violet-book` → Settings → Change Configuration → **Launch**(월 최소 요금 없음, $0.106/CU-시간)
- [ ] Neon 콘솔 → Branch `main` → Compute → Edit → 최대 **0.5 CU**(자동 일시정지는 켠 채로)
- [ ] 확인: `gh run list -R ytw418/nextneonews --limit 1` 다음 실행이 성공, `curl -I https://unnienote.app/ko/idol/apink` 가 200

DB 가 살아 있지 않으면 빌드가 프리렌더 DB 조회에서 실패한다(뉴스·홈). 가이드 섹션은 DB 없이도 빌드된다(오늘 밤 수정 뒤).

## 1. 배포 전 확인 (에이전트)

- [ ] dev 에서 `npm run typecheck && npm run lint && npm test && npm run check-catalog -w @kmedia/web && npm run build`
- [ ] 아이폰 크기 캡처: 홈·가이드·뷰티 상세·테스트 결과·명소·시술·드라마·저장함·404 (en·ja·zh-TW)

## 2. 배포 (에이전트)

- [x] dev → main 병합·push → Vercel 운영 빌드 성공 확인(`list_deployments`)
- [x] GitHub Actions `pipeline` 을 workflow_dispatch 로 한 번 → `ItemVote` 마이그레이션 적용, 새 글·재생성
- [ ] 무관 기사 내리기: `gh workflow run maintenance -f command="unpublish --off-topic"`(목록 확인은 `--dry`, 10-20 15건)

## 3. 배포 뒤 확인

- [ ] `sh scripts/smoke.sh` (운영)
- [ ] 새 경로 200: `/en/guide /ja/beauty /zh-tw/travel /en/clinic /en/drama /en/saved /en/partners /en/disclosure`
- [ ] 색인 언어 밖(`/ko/beauty`)은 `X-Robots-Tag: noindex, follow`, 사이트맵에 새 섹션은 en·ja·zh-TW 만
- [ ] 투표 1번(뷰티) → 새로고침해도 숫자 유지
- [ ] Neon 콘솔 Usage: 다음 2~3일 하루 CU-시간이 1시간 안팎인지(목표 월 15~30)

## 4. 수익 연결 (사장님 → 에이전트)

- [ ] 제휴 승인되면 링크 형식을 알려 주기 → Vercel env `AFFILIATE_*` 넣고 재배포(아마존은 고지 문장 배포 뒤)
- [ ] 애드센스 가이드 광고 단위 발급 → `NEXT_PUBLIC_ADSENSE_SLOT_GUIDE`
- [ ] 쿠팡 파트너스 '미디어 관리'에 `https://unnienote.app` 등록

## 되돌리기

- Vercel → Deployments → 이전 운영 배포 → Promote(즉시). `ItemVote` 테이블은 남아도 옛 코드에 영향 없음.
