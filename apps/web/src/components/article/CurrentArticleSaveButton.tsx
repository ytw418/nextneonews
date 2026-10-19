"use client";

import { useEffect, useState } from "react";

import { CURRENT_EVENT, type CurrentArticle } from "@/components/article/NextArticleLoader";
import { SaveButton } from "@/components/SaveButton";

interface Props {
  slug: string; // 처음 연 글의 slug (저장 키)
  title: string;
}

// 글 화면 상단바의 저장 버튼. 다음 글이 이어 붙어 지금 글이 바뀌면(hb:current-article) 그 글을 저장 대상으로 바꾼다.
// 원래 글로 돌아오면 그 이벤트가 원래 글을 담아 오므로 처음 값으로 돌아간다.
// key 로 다시 마운트해 이전 글의 저장 상태·튀는 효과가 남지 않게 한다
export function CurrentArticleSaveButton({ slug: initialSlug, title: initialTitle }: Props) {
  const [target, setTarget] = useState({ slug: initialSlug, title: initialTitle });

  useEffect(() => {
    const onCurrent = (event: Event) => {
      const { slug, title } = (event as CustomEvent<CurrentArticle>).detail;
      setTarget({ slug, title });
    };
    window.addEventListener(CURRENT_EVENT, onCurrent);
    return () => window.removeEventListener(CURRENT_EVENT, onCurrent);
  }, []);

  return <SaveButton key={target.slug} kind="article" id={target.slug} title={target.title} />;
}
