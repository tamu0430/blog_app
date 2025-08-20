import { useRouter } from "next/navigation";
import axios from "axios";
import { getHeaders, loadToken } from '@/utils/api';

export const useAuth = () => {
  const router = useRouter();

  const logout = async () => {
    try {
      const token = loadToken();
      if (!token) {
        // 未ログインならログインページへ
        router.push("/admin/login");
        return;
      }

      await axios.post("http://localhost:3001/auth/logout", {}, { headers: getHeaders(token) });

      // ログイン画面へ遷移
      router.push("/admin/login");
    } catch (error) {
      console.error("ログアウトに失敗しました", error);
    }
  };

  return { logout };
};
