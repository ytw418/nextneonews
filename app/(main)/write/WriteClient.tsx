"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { Category } from "@/types/news";
import Image from "next/image";

interface WriteFormData {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: Category;
  tags: string;
}

const categories: Category[] = [
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

const WriteClient = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<WriteFormData>({
    defaultValues: {
      title: "",
      summary: "",
      content: "",
      imageUrl: "",
      category: "테크",
      tags: "",
    },
  });

  const onSubmit = async (data: WriteFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          tags: data.tags.split(",").map((tag) => tag.trim()),
        }),
      });

      if (!response.ok) {
        throw new Error("뉴스 작성에 실패했습니다");
      }

      const result = await response.json();
      toast.success("뉴스가 성공적으로 작성되었습니다");
      router.push(`/post/${result.id}`);
    } catch (error) {
      toast.error("뉴스 작성 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const imageUrlPattern = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i;

    if (url && imageUrlPattern.test(url)) {
      const currentContent = getValues("content") || "";
      const imageMarkdown = `![이미지](${url})`;

      const newContent = currentContent
        ? `${currentContent}\n\n${imageMarkdown}`
        : imageMarkdown;

      setValue("content", newContent, {
        shouldDirty: true,
        shouldTouch: true,
      });

      toast.success("이미지가 본문에 추가되었습니다");
    }
  };

  return (
    <div className="container-custom py-8" data-color-mode="auto">
      <h1 className="text-2xl font-bold mb-6">뉴스 작성</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block mb-2">제목</label>
          <input
            {...register("title", { required: "제목을 입력해주세요" })}
            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-2">요약</label>
          <textarea
            {...register("summary", { required: "요약을 입력해주세요" })}
            rows={3}
            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
          {errors.summary && (
            <p className="text-red-500 text-sm mt-1">
              {errors.summary.message}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-2">내용</label>
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
            마크다운 에디터를 사용하여 작성할 수 있습니다.
          </div>
          <Controller
            name="content"
            control={control}
            rules={{ required: "내용을 입력해주세요" }}
            render={({ field }) => (
              <div className="markdown-editor">
                <MDEditor
                  value={field.value}
                  onChange={(value) => {
                    const newValue = value || "";

                    const imageUrlPattern =
                      /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i;
                    const words = newValue.split(/\s+/);

                    let processedValue = newValue;
                    words.forEach((word) => {
                      if (
                        imageUrlPattern.test(word) &&
                        !word.startsWith("![")
                      ) {
                        processedValue = processedValue.replace(
                          word,
                          `![이미지](${word})`
                        );
                      }
                    });

                    field.onChange(processedValue);
                  }}
                  preview="live"
                  height={500}
                  className="dark:bg-gray-800"
                  textareaProps={{
                    placeholder: "내용을 입력해주세요...",
                  }}
                />
              </div>
            )}
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">
              {errors.content.message}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-2">대표 이미지 URL</label>
          <input
            {...register("imageUrl", {
              required: "대표 이미지 URL을 입력해주세요",
            })}
            type="url"
            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
          {errors.imageUrl && (
            <p className="text-red-500 text-sm mt-1">
              {errors.imageUrl.message}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-2">카테고리</label>
          <select
            {...register("category")}
            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2">태그 (쉼표로 구분)</label>
          <input
            {...register("tags", { required: "태그를 입력해주세요" })}
            placeholder="예: AI, 기술, 혁신"
            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
          {errors.tags && (
            <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "작성 중..." : "작성하기"}
        </button>
      </form>
    </div>
  );
};

export default WriteClient;
