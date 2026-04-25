// src/pages/Subscriptions/Subscriptions.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { API_BASE } from "@/api/auth";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import {
  COLORS, FONTS, COPY,
  API_SUB, formatDate, formatCost,
} from "./subscriptions.config";
import type { Tariff, MySubscription } from "./subscriptions.config";

export default function Subscriptions() {
  const navigate    = useNavigate();
  const accessToken = useAuthStore(s => s.accessToken);

  const [tariffs,     setTariffs]     = useState<Tariff[]>([]);
  const [mySub,       setMySub]       = useState<MySubscription | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [subError,    setSubError]    = useState("");
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchTariffs = fetch(`${API_BASE}${API_SUB.tariffs}`)
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);

    const fetchMySub = accessToken
      ? fetch(`${API_BASE}${API_SUB.me}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      : Promise.resolve(null);

    Promise.all([fetchTariffs, fetchMySub]).then(([t, s]) => {
      setTariffs(t);
      setMySub(s);
      setLoading(false);
    });
  }, []);

  const handleSubscribe = async (tariffId: number) => {
    if (!accessToken) { navigate("/auth"); return; }
    setSubscribing(tariffId);
    setSubError("");
    try {
      const res = await fetch(`${API_BASE}${API_SUB.subscribe}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ tariff_id: tariffId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubError(data.detail ?? data.non_field_errors?.[0] ?? "Ошибка при оформлении подписки");
        return;
      }
      setMySub(data as MySubscription);
    } catch {
      setSubError("Ошибка сети. Попробуй позже.");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}

        .tariff-card{background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:16px;padding:1.75rem;display:flex;flex-direction:column;gap:1rem;transition:all .2s}
        .tariff-card:hover{border-color:${COLORS.borderHover};transform:translateY(-3px);background:${COLORS.bgCardHover}}
        .tariff-card.active-card{border-color:rgba(34,197,94,0.3);background:rgba(34,197,94,0.04)}
        .tariff-card.trial-card{border-color:rgba(58,142,255,0.25);background:rgba(58,142,255,0.04)}

        .connect-btn{width:100%;background:${COLORS.accent};color:#fff;border:none;border-radius:9px;padding:.75rem;font-family:${FONTS.body};font-weight:700;font-size:.875rem;cursor:pointer;transition:all .18s;margin-top:auto}
        .connect-btn:hover:not(:disabled){background:#FF5555;transform:translateY(-1px)}
        .connect-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .current-btn{width:100%;background:rgba(34,197,94,0.1);color:#4ade80;border:1px solid rgba(34,197,94,0.25);border-radius:9px;padding:.75rem;font-family:${FONTS.body};font-weight:700;font-size:.875rem;cursor:default;margin-top:auto}

        /* responsive — см. src/styles/responsive.css */
      `}</style>

      <DashboardNav />

      <main className="sub-main" style={{ maxWidth: "1100px", margin: "0 auto", padding: "3.5rem 3rem" }}>

        {/* Заголовок */}
        <p className="fade-up-1" style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".5rem" }}>
          {COPY.pageLabel}
        </p>
        <h1 className="fade-up-2" style={{ fontFamily: FONTS.display, fontSize: "clamp(1.8rem,3.5vw,2.4rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary, marginBottom: ".5rem" }}>
          {COPY.pageTitle}
        </h1>
        <p className="fade-up-3" style={{ fontSize: ".9rem", color: COLORS.textMuted, marginBottom: "2.5rem" }}>
          {COPY.pageSubtitle}
        </p>

        {/* ── Текущая подписка ── */}
        <section className="fade-up-4" style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontFamily: FONTS.display, fontSize: "1rem", fontWeight: 700, color: COLORS.textPrimary, marginBottom: "1rem" }}>
            {COPY.currentTitle}
          </h2>

          {loading ? (
            <div style={{ height: "72px", background: COLORS.bgCard, borderRadius: "12px", border: `1px solid ${COLORS.border}` }} />
          ) : mySub?.is_active ? (
            <div style={{
              background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: "12px", padding: "1.1rem 1.4rem",
              display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
            }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#4ade80" }}>
                  {mySub.tariff_title}
                </div>
                <div style={{ fontSize: ".75rem", color: COLORS.textFaint, marginTop: ".2rem" }}>
                  {COPY.activeUntil} {formatDate(mySub.deadline)} · {mySub.tariff_days_count} {COPY.days}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
              borderRadius: "12px", padding: "1.1rem 1.4rem",
              display: "flex", alignItems: "center", gap: "1rem",
            }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS.textFaint, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: ".88rem", fontWeight: 600, color: COLORS.textMuted }}>
                  {COPY.noSub}
                </div>
                <div style={{ fontSize: ".75rem", color: COLORS.textFaint, marginTop: ".2rem" }}>
                  {COPY.noSubHint}
                </div>
              </div>
            </div>
          )}
        </section>

        {subError && (
          <div style={{ background: "rgba(255,58,58,0.08)", border: "1px solid rgba(255,58,58,0.2)", borderRadius: "10px", padding: ".85rem 1.1rem", fontSize: ".84rem", color: "#FF6B6B", marginBottom: "1.5rem" }}>
            {subError}
          </div>
        )}

        {/* ── Тарифы ── */}
        {!loading && (
          <div className="tariff-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {tariffs.map(t => {
              const isCurrent = mySub?.is_active && mySub.tariff === t.id;
              const cardClass  = isCurrent ? "tariff-card active-card"
                               : t.is_trial ? "tariff-card trial-card"
                               : "tariff-card";
              return (
                <div key={t.id} className={cardClass}>

                  <div>
                    <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".35rem" }}>
                      {COPY.tariffLabel}
                    </div>
                    <div style={{ fontFamily: FONTS.display, fontSize: "1.3rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      {t.title}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: FONTS.display, fontSize: "1.75rem", fontWeight: 800, color: isCurrent ? "#4ade80" : COLORS.textPrimary, letterSpacing: "-.02em" }}>
                      {formatCost(t.cost)}
                    </div>
                    <div style={{ fontSize: ".78rem", color: COLORS.textFaint, marginTop: ".25rem" }}>
                      {t.days_count} {COPY.days}
                    </div>
                  </div>

                  {isCurrent ? (
                    <div className="current-btn">{COPY.btnCurrent}</div>
                  ) : (
                    <button
                      className="connect-btn"
                      disabled={subscribing === t.id || !!mySub?.is_active}
                      onClick={() => handleSubscribe(t.id)}
                    >
                      {subscribing === t.id ? "Оформляем..." : COPY.btnConnect}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
