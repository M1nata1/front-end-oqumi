// src/router/ProtectedRoute.tsx

import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { API_BASE, decodeJwt } from "@/api/auth";

/** Возвращает true если JWT истёк (с запасом 10 секунд) */
function isExpired(token: string): boolean {
  try {
    const payload = decodeJwt(token);
    const exp = payload.exp as number;
    return Date.now() / 1000 >= exp - 10;
  } catch {
    return true;
  }
}

type Status = "checking" | "ok" | "fail";

export default function ProtectedRoute() {
  const { isAuth, accessToken, refreshToken, user, setAuth, clearAuth } = useAuthStore();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    // 1. Не авторизован вообще
    if (!isAuth || !accessToken || !user) {
      setStatus("fail");
      return;
    }

    // 2. Access-токен ещё живой
    if (!isExpired(accessToken)) {
      setStatus("ok");
      return;
    }

    // 3. Access протух — пробуем refresh
    if (!refreshToken || isExpired(refreshToken)) {
      clearAuth();
      setStatus("fail");
      return;
    }

    fetch(`${API_BASE}/users/auth/token/refresh/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refresh: refreshToken }),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { access: string }) => {
        setAuth(user, data.access, refreshToken);
        setStatus("ok");
      })
      .catch(() => {
        clearAuth();
        setStatus("fail");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "checking") return null;
  return status === "ok" ? <Outlet /> : <Navigate to="/auth" replace />;
}
