"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";

interface GenerateFormData {
  urls: { value: string }[];
}

const GenerateClient = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateFormData>({
    defaultValues: {
      urls: [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "urls",
  });

  const onSubmit = async (data: GenerateFormData) => {
    setIsGenerating(true);
    const toastId = toast.loading("AI가 뉴스를 생성하고 있습니다...");

    try {
      const validUrls = data.urls
        .map((url) => url.value.trim())
        .filter((url) => url !== "");

      const response = await fetch("/api/news/aiNews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: validUrls }),
      });

      if (!response.ok) {
        throw new Error("뉴스 생성에 실패했습니다");
      }

      const result = await response.json();
      toast.success(`${result.count}개의 뉴스가 생성되었습니다!`, {
        id: toastId,
      });
    } catch (error) {
      toast.error("뉴스 생성 중 오류가 발생했습니다", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold mb-6">AI 뉴스 생성</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input
                type="url"
                {...register(`urls.${index}.value` as const, {
                  required: index === 0 ? "URL을 입력해주세요" : false,
                })}
                placeholder="참고할 뉴스 URL을 입력하세요"
                className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
          {errors.urls?.[0]?.value && (
            <p className="text-red-500 text-sm mt-1">
              {errors.urls[0].value.message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => append({ value: "" })}
          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 p-2 rounded-lg hover:border-primary dark:hover:border-primary transition-colors"
        >
          + URL 추가
        </button>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? "생성 중..." : "AI 뉴스 생성하기"}
        </button>
      </form>
    </div>
  );
};

export default GenerateClient;
