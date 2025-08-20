"use client";

import { deleteToken, getHeaders, loadToken } from '@/utils/api';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Post = {
  id: number;
  title: string;
}

export default function AdminPostsPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 記事一覧を取得
  useEffect(() => {
    axios.get("http://localhost:3001/posts?userId=1")
      .then((res) => {
        setPosts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("記事の取得に失敗しました", err);
        setLoading(false);
      });
  }, []);

  // 記事削除処理
  const handleDelete = async (id: number) => {
    if (!confirm("本当に削除しますか？")) return;

    try {
      const token = loadToken();
      if (!token) {
        // 未ログインならログインページへ
        router.push("/admin/login");
        return;
      }

      await axios.delete(`http://localhost:3001/posts/${id}`, { headers: getHeaders(token) });
      setPosts(posts.filter(post => post.id !== id));
    } catch {
      setError("記事の更新に失敗しました");
    }
  };

  // ログアウト
  const logout = () => {
    deleteToken();
    // ログインページへ
    router.push("/admin/login");
  }

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">管理者用記事一覧</h1>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
      >
        ログアウト
      </button>

      {/* 記事作成ボタン */}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => router.push("/admin/posts/new")}
      >
        記事作成
      </button>

      {/* 記事一覧 */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border p-2">タイトル</th>
            <th className="border p-2">編集</th>
            <th className="border p-2">削除</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border">
              <td className="border p-2">{post.title}</td>
              <td className="border p-2">
                <button
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                  onClick={() => router.push(`/admin/posts/edit/${post.id}`)}
                >
                  編集
                </button>
              </td>
              <td className="border p-2">
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => handleDelete(post.id)}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
