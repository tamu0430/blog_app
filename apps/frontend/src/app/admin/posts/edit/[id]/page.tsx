"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { getHeaders, loadToken } from '@/utils/api';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const postSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  content: z.string().min(1, "記事内容は必須です"),
});

type PatchFormValues = z.infer<typeof postSchema>;

export default function EditPostPage() {
  const router = useRouter();
  const { id } = useParams(); // URL の id を取得

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState({
    title: '', content: ''
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatchFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues,
    values: defaultValues,
  });

  // 記事詳細を取得
  useEffect(() => {
    if (!id) return;
    axios.get(`http://localhost:3001/posts/${id}`)
      .then((res) => {
        setDefaultValues({ title: res.data.title, content: res.data.content });
        setLoading(false);
      })
      .catch((err) => {
        console.error("記事の取得に失敗しました", err);
        setError("記事の取得に失敗しました");
        setLoading(false);
      });
  }, [id]);

  // 記事更新処理
  const onSubmit = async (data: PatchFormValues) => {
    try {
      const token = loadToken();
      if (!token) {
        // 未ログインならログインページへ
        router.push("/admin/login");
        return;
      }

      await axios.patch(
        `http://localhost:3001/posts/${id}`,
        data,
        { headers: getHeaders(token) });

      router.push("/admin/posts"); // 一覧ページに戻る
    } catch {
      setError("記事の更新に失敗しました");
    }
  };

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-gray-900 text-2xl font-bold mb-4">ブログ記事の編集</h1>
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
        <input type="hidden" value='1' name='authorId' />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={isSubmitting}
        >
          {isSubmitting ? "更新中..." : "更新"}
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
