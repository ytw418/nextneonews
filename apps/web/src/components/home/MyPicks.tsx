"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { CheckIcon } from "@/components/icons";
import { EntityAvatar } from "@/components/rankings/EntityAvatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListRow } from "@/components/ui/ListRow";
import { PICKS_MAX, type PickItem, savePicks, useHydrated, usePicks } from "@/lib/picks";
import { track } from "@/lib/track";

// 서버가 그날 차트에서 뽑은 후보 (lib/home-picks.ts 에서 D-day 글자를 붙인 것)
export interface PickCandidateView {
  id: string;
  name: string;
  slug: string | null;
  avatar: string | null;
  tint: string;
  latest: { slug: string; title: string } | null;
  dday: { label: string; hot: boolean; name: string } | null;
}

// 홈 첫 화면 '내 최애'. 로그인 없이 얼굴을 눌러 1~3명 고르고(이 기기 저장), 고르면 그 사람의 최신 글·다음 일정이 홈 맨 위에 온다.
// 처음 온 사람(대부분)이 보는 고르기 카드는 서버 HTML 에도 그대로 있고, 고른 사람은 하이드레이션 뒤에 자기 줄로 바뀐다
export function MyPicks({ candidates }: { candidates: PickCandidateView[] }) {
  const picks = usePicks();
  const hydrated = useHydrated();
  const [editing, setEditing] = useState(false);

  if (candidates.length === 0 && picks.length === 0) return null;
  if (hydrated && picks.length > 0 && !editing) {
    return <PickedList picks={picks} candidates={candidates} onEdit={() => setEditing(true)} />;
  }
  return (
    <Picker
      key={editing ? "edit" : "new"}
      candidates={candidates}
      initial={hydrated ? picks : []}
      editing={editing}
      onDone={() => setEditing(false)}
    />
  );
}

function Picker({
  candidates,
  initial,
  editing,
  onDone,
}: {
  candidates: PickCandidateView[];
  initial: PickItem[];
  editing: boolean;
  onDone: () => void;
}) {
  const t = useTranslations("Today");
  const [chosen, setChosen] = useState<PickItem[]>(initial);
  // 고른 사람이 오늘 후보에 없어도(차트에서 빠짐) 고르기 줄에 남겨 뺄 수 있게 한다
  const faces: Omit<PickItem, "at">[] = [
    ...initial.filter((p) => !candidates.some((c) => c.id === p.id)),
    ...candidates,
  ];
  const full = chosen.length >= PICKS_MAX;

  const toggle = (face: Omit<PickItem, "at">) =>
    setChosen((list) =>
      list.some((p) => p.id === face.id)
        ? list.filter((p) => p.id !== face.id)
        : list.length >= PICKS_MAX
          ? list
          : [...list, { id: face.id, name: face.name, slug: face.slug, avatar: face.avatar, tint: face.tint, at: Date.now() }],
    );

  const save = () => {
    savePicks(chosen);
    track("pick_save", { count: chosen.length, from: editing ? "edit" : "home" });
    onDone();
  };

  // 카드 없이 제목 줄 + 한 줄 설명 + 얼굴 줄만 (첫 화면에서 오늘의 탑 기사가 보이게 낮게)
  return (
    <section aria-labelledby="home-picks">
      <div className="flex min-h-11 items-center justify-between gap-3 px-gutter pt-5">
        <h2 id="home-picks" className="min-w-0 text-t4 font-bold text-ink-900">
          {editing ? t("picks.mine") : t("picks.title")}
        </h2>
        <span className="flex shrink-0 items-center gap-2">
          {editing && (
            <Button size="m" variant="neutral" onClick={onDone}>
              {t("picks.cancel")}
            </Button>
          )}
          {(chosen.length > 0 || editing) && (
            <Button size="m" onClick={save}>
              {t("picks.save")}{" "}
              <span className="tabular-nums">
                {chosen.length}/{PICKS_MAX}
              </span>
            </Button>
          )}
        </span>
      </div>
      <p className="px-gutter text-t7 text-ink-600">{t("picks.pitch", { max: PICKS_MAX })}</p>
      <ul className="rail mt-2 gap-1 px-3" aria-label={t("picks.title")}>
        {faces.map((face) => {
          const on = chosen.some((p) => p.id === face.id);
          return (
            <li key={face.id} className="shrink-0">
              <button
                type="button"
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => toggle(face)}
                className="press-soft flex w-[4.5rem] flex-col items-center gap-1 py-1 disabled:opacity-40"
              >
                <span className={`relative rounded-full p-0.5 ${on ? "bg-brand" : ""}`}>
                  <span className="block rounded-full bg-bg p-0.5">
                    <EntityAvatar name={face.name} src={face.avatar} tint={face.tint} size={48} />
                  </span>
                  {on && (
                    <span className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-brand text-white ring-2 ring-bg">
                      <CheckIcon className="size-3.5" />
                    </span>
                  )}
                </span>
                <span
                  className={`w-full truncate text-center text-st12 ${on ? "font-bold text-ink-900" : "font-semibold text-ink-700"}`}
                >
                  {face.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PickedList({
  picks,
  candidates,
  onEdit,
}: {
  picks: PickItem[];
  candidates: PickCandidateView[];
  onEdit: () => void;
}) {
  const t = useTranslations("Today");
  return (
    <section aria-labelledby="home-picks">
      <div className="flex items-center justify-between gap-3 px-gutter pt-6 pb-1">
        <h2 id="home-picks" className="text-t4 font-bold text-ink-900">
          {t("picks.mine")}
        </h2>
        <button
          type="button"
          onClick={onEdit}
          className="press -my-2 -mr-2 flex min-h-11 items-center rounded-btn-m px-2 text-t6 font-medium text-ink-600"
        >
          {t("picks.edit")}
        </button>
      </div>
      <ul>
        {picks.map((pick) => {
          const today = candidates.find((c) => c.id === pick.id);
          const latest = today?.latest ?? null;
          // 최신 글이 있으면 그 글로, 없으면 인물 페이지로 (둘 다 없으면 누를 곳이 없다)
          const href = latest ? `/news/${latest.slug}` : pick.slug ? `/idol/${pick.slug}` : undefined;
          return (
            <ListRow
              key={pick.id}
              href={href}
              alignTop
              arrow={!!href}
              left={<EntityAvatar name={pick.name} src={today?.avatar ?? pick.avatar} tint={pick.tint} size={48} />}
              title={
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{today?.name ?? pick.name}</span>
                  {today?.dday && (
                    <Badge tone={today.dday.hot ? "brand" : "brandWeak"}>
                      {today.dday.label} · {today.dday.name}
                    </Badge>
                  )}
                </span>
              }
              sub={
                latest ? (
                  <span className="line-clamp-2 text-ink-700">{latest.title}</span>
                ) : (
                  <span className="text-ink-600">{t("picks.noNews")}</span>
                )
              }
            />
          );
        })}
      </ul>
    </section>
  );
}
