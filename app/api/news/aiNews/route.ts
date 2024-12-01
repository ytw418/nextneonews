import { prisma } from "@/libs/prisma";
import { HfInference } from "@huggingface/inference";
import { NextResponse } from "next/server";
// 라인 타입 정의
type Line = string;

// 기본 참고 URL 목록
const DEFAULT_REFERENCE_URLS = [
  "https://entertain.naver.com/ranking#type=hit_total&date=2024-11-26",
  // 실제 사용할 URL들로 교체해주세요
];

// 기본 이미지 URL 추가
const DEFAULT_IMAGE_URL = "/images/haci.png";

// 이미지 URL 유효성 검사 함수
const isValidImageUrl = (url: string): string => {
  if (!url) return DEFAULT_IMAGE_URL;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return DEFAULT_IMAGE_URL;
};

// 뉴스 생성을 위한 프롬프트 템플릿
const NEWS_PROMPT = `
뉴스 기사를 생성 하세요
목표
입력 요구사항과 구성된 JSON 객체를 참고해서 JSON 객체를 만들주세요

입력 요구사항
사용 언어: {language}
참고할 사이트 URL: {urls}
콘텐츠 생성 범위: 기술 뉴스 기사

JSON 출력 구조
{
"title": "문자열: 간결하고 주목을 끄는 제목",
"summary": "문자열: 1-2 문장으로 간략한 개요",
"content": "문자열: 20-30 단어로 된 상세 기사 텍스트",
"category": "열거형: [테크, 모바일, 자동차, 금융, 경제, K-POP, 엔터테인먼트, 게임, 라이프스타일]",
"tags": "배열: 3-5개의 관련 키워드",
"imageUrl": "문자열: 주제와 관련된 Unsplash 이미지 URL"
}
`;

// 지원하는 언어 설정
const LANGUAGES = [
  { code: "ko", name: "Korean" },
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
];

export async function POST(req: Request) {
  try {
    const { urls = DEFAULT_REFERENCE_URLS, languages = ["ko", "en"] } =
      await req.json();

    // URL 유효성 검사 추가
    const validUrls = urls.filter((url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "유효한 URL이 없습니다." },
        { status: 400 }
      );
    }

    // 언어 유효성 검사 추가
    const validLanguages = languages.filter((lang: string) =>
      LANGUAGES.some((l) => l.code === lang)
    );

    if (validLanguages.length === 0) {
      return NextResponse.json(
        { error: "유효한 언어가 없습니다." },
        { status: 400 }
      );
    }

    const selectedLanguages = LANGUAGES.filter((lang) =>
      validLanguages.includes(lang.code)
    );

    const newsPromises = selectedLanguages.map(async (lang) => {
      const urlsText = urls.map((url: string) => `- ${url}`).join("\n");
      const prompt = NEWS_PROMPT.replace("{language}", lang.name).replace(
        "{urls}",
        urlsText
      );

      const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

      // 에러 처리와 재시도 로직을 포함한 안전한 호출
      const callHfApi = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const response = await hf.textGeneration({
              // 선택 가능한 모델들:
              model: "tiiuae/falcon-7b-instruct", // 더 강력한 instruction 모델
              // 또는
              // model: "facebook/opt-350m",  // Meta의 중간 크기 모델
              // model: "bigscience/bloom-560m",  // 다국어 지원이 좋은 모델
              // model: "google/flan-t5-base",  // Google의 instruction 튜닝 모델

              inputs: prompt,
              parameters: {
                max_new_tokens: 500,
              },
            });
            return response;
          } catch (error) {
            if (i === retries - 1) throw error;
            // Rate limit에 걸린 경우 잠시 대기
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      };

      const response = await callHfApi();

      console.log("callHfApi response :>> ", response);
      const text = response?.generated_text || "";

      const lines: Line[] = text.split("\n");

      const title =
        lines
          .find((line: Line) => line.startsWith("Title:"))
          ?.replace("Title:", "")
          .trim() || "";
      const summary =
        lines
          .find((line: Line) => line.startsWith("Summary:"))
          ?.replace("Summary:", "")
          .trim() || "";
      const content =
        lines
          .find((line: Line) => line.startsWith("Content:"))
          ?.replace("Content:", "")
          .trim() || "";
      const category =
        lines
          .find((line: Line) => line.startsWith("Category:"))
          ?.replace("Category:", "")
          .trim() || "GENERAL";
      const tags =
        lines
          .find((line: Line) => line.startsWith("Tags:"))
          ?.replace("Tags:", "")
          .trim()
          .split(",")
          .map((tag) => tag.trim()) || [];
      const rawImageUrl =
        lines
          .find((line: Line) => line.startsWith("ImageUrl:"))
          ?.replace("ImageUrl:", "")
          .trim() || "";

      // 이미지 URL 유효성 검사 적용
      const validImageUrl = isValidImageUrl(rawImageUrl);

      return {
        title,
        summary,
        content,
        imageUrl: validImageUrl, // 검증된 이미지 URL 사용
        category,
        tags: ["AI", ...tags],
        author: "AI News Bot",
        source: urls.join(", "),
        language: lang.code,
      };
    });

    const newsDataArray = await Promise.all(newsPromises);

    const createdNews = await prisma.news.createMany({
      data: newsDataArray,
    });

    return NextResponse.json(
      {
        message: "다국어 뉴스가 생성되었습니다.",
        count: createdNews.count,
        languages: selectedLanguages.map((lang) => lang.code),
        urls: urls,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("AI 뉴스 생성 중 오류 발생:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json(
      { error: `AI 뉴스 생성 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
