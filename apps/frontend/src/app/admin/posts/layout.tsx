"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadToken } from '@/utils/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = loadToken();

    if (token == null) {
      // 未ログインならログインページへ
      router.replace("/admin/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router, setIsAuthenticated]);

  if (!isAuthenticated) return <p>読み込み中...</p>;

  return <>{children}</>;
}
