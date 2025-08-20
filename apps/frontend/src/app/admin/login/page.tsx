"use client";

import { useForm } from "react-hook-form";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveToken } from '@/utils/api';

type LoginForm = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await axios.post("http://localhost:3001/auth/login", data);

      if (response.status === 200) {
        const token = response.data.access_token;
        // JWTトークンをlocalStorageに保存
        saveToken(token)

        // ログインユーザーの記事一覧へリダイレクト
        router.push("/admin/posts");
      } else {
        setErrorMessage("ログインに失敗しました。ユーザー名またはパスワードを確認してください。");
      }
    } catch {
      setErrorMessage("ログインに失敗しました。ユーザー名またはパスワードを確認してください。");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">管理者ログイン</h1>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">ユーザー名</label>
          <input
            type="text"
            {...register("username", { required: "必須入力です" })}
            className="w-full border rounded px-3 py-2"
          />
          {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">パスワード</label>
          <input
            type="password"
            {...register("password", { required: "必須入力です" })}
            className="w-full border rounded px-3 py-2"
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        </div>

        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">ログイン</button>
      </form>
    </div>
  );
}
