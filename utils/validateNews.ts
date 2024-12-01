export function validateNewsData(newsData: any) {
  const requiredFields = [
    "title",
    "summary",
    "content",
    "category",
    "tags",
    "imageUrl",
  ];

  for (const field of requiredFields) {
    if (!newsData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // 카테고리 검증
  const validCategories = [
    "테크",
    "모바일",
    "자동차",
    "금융",
    "경제",
    "K-POP",
    "엔터테인먼트",
    "게임",
    "라이프스타일",
  ];
  if (!validCategories.includes(newsData.category)) {
    throw new Error(`Invalid category: ${newsData.category}`);
  }

  // 태그 검증
  if (!Array.isArray(newsData.tags) || newsData.tags.length < 3) {
    throw new Error("Tags must be an array with at least 3 items");
  }

  return true;
}
