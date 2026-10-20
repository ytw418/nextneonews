import { SITE_NAME } from "@kmedia/core";

// 404·오류 화면 공통 몸통: 로고 머리말 + 메모 한 장(마스킹테이프 + 틴트, 잘린 큰 숫자) + 홈·가이드(·다시 시도) 버튼.
// [locale]/not-found·error(레이아웃 안, 탭바 있음)와 루트 not-found·global-error(레이아웃 밖, 정적)가 함께 쓴다.
// 훅·next-intl·DB 를 쓰지 않는다: 언어 문맥이 없는 정적 화면과 DB 가 꺼진 때도 그대로 그린다.
// 링크는 <a> 로 둔다 — 오류 뒤에는 화면을 새로 받는 편이 낫고, 레이아웃 밖 화면에는 next-intl Link 가 없다.
// 이 화면들에는 애드센스를 넣지 않는다 (내용 없는 화면에 광고 금지, components/HeadScripts.tsx)

// Button(m) 과 같은 모양. 채움(primary)은 하나만
const BUTTON =
  "press hit relative inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-btn-m px-4 text-center text-t6 font-semibold";
const PRIMARY = `${BUTTON} bg-brand text-white`;
const WEAK = `${BUTTON} bg-white/70 text-brand-ink dark:bg-black/25`;

export interface ErrorScreenText {
  title: string;
  body: string;
  home: string;
  guide: string;
}

interface Props {
  code: "404" | "500";
  text: ErrorScreenText;
  homeHref: string;
  guideHref: string;
  retry?: { label: string; onClick: () => void };
}

// 404 는 홈 피드 색(kpop), 오류는 생활 색 — 화면마다 틴트 하나
const TINT = { "404": "var(--tint-kpop)", "500": "var(--tint-life)" } as const;

export function ErrorHeader({ homeHref }: { homeHref: string }) {
  const [word, ...rest] = SITE_NAME.split(" ");
  return (
    <header className="app-header sticky top-0 z-30 bg-bar pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="relative mx-auto flex min-h-12 max-w-[640px] items-center px-2.5">
        <a href={homeHref} aria-label={SITE_NAME} className="header-logo ml-2.5 flex min-h-11 items-center">
          <span aria-hidden className="flex items-baseline">
            <span className="wordmark">
              {word}
              <span className="wordmark-dot">.</span>
            </span>
            <span className="wordmark-sub">{rest.join(" ")}</span>
          </span>
        </a>
      </div>
    </header>
  );
}

export function ErrorScreen({ code, text, homeHref, guideHref, retry }: Props) {
  return (
    <>
      <ErrorHeader homeHref={homeHref} />
      <section className="px-gutter pt-8 pb-6">
        <div
          className="relative rounded-card px-5 pt-8 pb-5 text-on-tint shadow-card"
          style={{ backgroundColor: TINT[code] }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-card">
            <span className="absolute -right-3 -bottom-6 select-none text-poster font-bold tracking-tighter tabular-nums text-on-tint-ghost">
              {code}
            </span>
          </span>
          <h1 className="title relative text-t3 font-bold">{text.title}</h1>
          <p className="relative mt-2 text-t6 text-on-tint-sub">{text.body}</p>
          <div className="relative mt-5 flex flex-wrap items-center gap-2">
            {retry ? (
              <>
                <button type="button" onClick={retry.onClick} className={PRIMARY}>
                  {retry.label}
                </button>
                <a href={homeHref} className={WEAK}>
                  {text.home}
                </a>
              </>
            ) : (
              <a href={homeHref} className={PRIMARY}>
                {text.home}
              </a>
            )}
            <a href={guideHref} className={WEAK}>
              {text.guide}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
