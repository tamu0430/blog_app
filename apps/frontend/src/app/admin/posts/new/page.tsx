"use client";

import { getHeaders, loadToken } from '@/utils/api';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  content: z.string().min(1, "記事内容は必須です"),
  tagNames: z.array(z.string()),
});

type PostFormValues = z.infer<typeof postSchema>;

export default function NewPostPage() {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostFormValues>({
    defaultValues: {
      tagNames: [] as string[],
    },
    resolver: zodResolver(postSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tagNames" as never,
  });

  const onSubmit = async (data: PostFormValues) => {
    try {
      const token = loadToken();
      if (!token) {
        // 未ログインならログインページへ
        router.push("/admin/login");
        return;
      }

      await axios.post("http://localhost:3001/posts", data, { headers: getHeaders(token) });

      router.push("/admin/posts"); // 一覧ページに戻る
    } catch (error) {
      const errorMsg = error instanceof AxiosError ? error.response?.data.message : "記事の投稿に失敗しました";
      setError(`エラー : ${errorMsg}`);
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-gray-900 text-2xl font-bold mb-4">ブログ記事の投稿</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">タイトル</label>
          <input
            {...register("title")}
            className="w-full p-2 border rounded"
          />
          {errors.title && <p className="text-red-500">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">記事内容</label>
          <textarea
            {...register("content")}
            className="w-full p-2 border rounded"
            rows={5}
          />
          {errors.content && <p className="text-red-500">{errors.content.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">タグ</label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center mb-2">
              <input
                {...register(`tagNames.${index}` as const)}
                className="flex-grow p-2 border rounded"
              />
              <button
                type="button"
                className="ml-2 text-red-500"
                onClick={() => remove(index)}
              >
                削除
              </button>
            </div>
          ))}
          <button
            type="button"
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
            onClick={() => append("")}
          >
            タグを追加
          </button>
        </div>
        <input type="hidden" value='1' name='authorId' />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={isSubmitting}
        >
          {isSubmitting ? "投稿中..." : "投稿"}
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded"
          onClick={() => router.push(`/admin/posts`)}
        >
          一覧に戻る
        </button>
      </form>
    </div>
  );
}
