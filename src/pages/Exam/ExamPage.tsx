// src/pages/Exam/ExamPage.tsx
// Route: /exam (protected)

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { API_BASE } from "@/api/auth";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { COLORS, FONTS } from "@/pages/Dashboard/dashboard.config";

interface ApiSubject {
  id:           number;
  name:         string;
  slug:         string;
  description:  string;
  type:         "MANDATORY" | "PROFILE";
  duration_sec: number;
  max_score:    number;
}
interface SubjectGroup {
  type:     "MANDATORY" | "PROFILE";
  subjects: ApiSubject[];
}

const PALETTE     = ["#3A8EFF", "#FF3A3A", "#3AFFB4", "#FF9F3A", "#B43AFF"];
const PALETTE_BG  = ["#0D1F3C", "#2A0A0A", "#0A2A1F", "#2A1A0A", "#1A0A2A"];
const subjectColor   = (i: number) => PALETTE[i % PALETTE.length];
const subjectBg      = (i: number) => PALETTE_BG[i % PALETTE_BG.length];

function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0 && m > 0) return `${h} ч ${m} мин`;
  if (h > 0)           return `${h} ч`;
  return `${m} мин`;
}

export default function ExamPage() {
  const navigate    = useNavigate();
  const accessToken = useAuthStore(s => s.accessToken);

  const [mandatory,    setMandatory]    = useState<ApiSubject[]>([]);
  const [profile,      setProfile]      = useState<ApiSubject[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [loading,      setLoading]      = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetch(`${API_BASE}/subjects/`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: unknown) => {
        const raw: SubjectGroup[] = Array.isArray((data as unknown[])?.[0])
          ? (data as SubjectGroup[][])[0]
          : (data as SubjectGroup[]);
        const m = raw.find(g => g.type === "MANDATORY")?.subjects ?? [];
        const p = raw.find(g => g.type === "PROFILE")?.subjects  ?? [];
        setMandatory(m);
        setProfile(p);
        if (p.length > 0) setSelectedSlug(p[0].slug);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const selectedProfileSub = profile.find(s => s.slug === selectedSlug);
  const allSelected        = [...mandatory, ...(selectedProfileSub ? [selectedProfileSub] : [])];
  const totalDuration      = allSelected.reduce((s, sub) => s + sub.duration_sec, 0);
  const totalScore         = allSelected.reduce((s, sub) => s + sub.max_score, 0);

  const handleStart = () =>
    navigate("/exam/session", { state: { profileSlug: selectedSlug || null } });

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}

        @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
        .skel{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.04) 75%);background-size:1200px 100%;animation:shimmer 1.4s infinite;border-radius:8px}

        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fu1{animation:fadeUp .5s ease both .05s}
        .fu2{animation:fadeUp .5s ease both .18s}
        .fu3{animation:fadeUp .5s ease both .32s}
        .fu4{animation:fadeUp .5s ease both .46s}

        .num{font-variant-numeric:tabular-nums lining-nums;font-feature-settings:"tnum","lnum"}

        .sub-row{
          display:flex;align-items:center;gap:1rem;padding:.9rem 0;
          border-bottom:1px solid ${COLORS.border};
        }
        .sub-row:last-child{border-bottom:none}

        .profile-tile{
          position:relative;height:210px;border-radius:16px;overflow:hidden;
          cursor:pointer;border:2px solid transparent;
          transition:border-color .2s, transform .2s, box-shadow .2s;
          text-align:left;background:none;padding:0;
        }
        .profile-tile:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,0.5)}
        .profile-tile.sel{transform:translateY(-3px)}

        .btn-start{
          background:${COLORS.accent};color:#fff;border:none;
          padding:.78rem 1.75rem;border-radius:10px;
          font-family:${FONTS.body};font-weight:700;font-size:.92rem;
          cursor:pointer;transition:all .18s;white-space:nowrap;
        }
        .btn-start:hover:not(:disabled){background:#FF5555;transform:translateY(-1px)}
        .btn-start:disabled{opacity:.45;cursor:not-allowed}
      `}</style>

      <DashboardNav />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "3.5rem 3rem" }}>

        {/* ── Header ── */}
        <div className="fu1" style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".5rem" }}>
            Экзамен КТ
          </p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: "-.03em", color: COLORS.textPrimary, lineHeight: 1.1, marginBottom: ".5rem" }}>
            Начать экзамен
          </h1>
          <p style={{ fontSize: ".88rem", color: COLORS.textMuted }}>
            Обязательные блоки КТ для всех направлений магистратуры
          </p>
        </div>

        {/* ── Mandatory subjects ── */}
        <div className="fu2" style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "16px", padding: "1.5rem 1.75rem", marginBottom: "2rem" }}>
          <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: "1rem" }}>
            Обязательные предметы
          </p>

          {loading ? (
            <div>
              {[0, 1].map(i => (
                <div key={i} className="sub-row">
                  <div className="skel" style={{ width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skel" style={{ height: "11px", width: "130px", marginBottom: ".4rem" }} />
                    <div className="skel" style={{ height: "9px", width: "80px" }} />
                  </div>
                  <div className="skel" style={{ height: "11px", width: "50px" }} />
                </div>
              ))}
            </div>
          ) : (
            mandatory.map((sub, i) => (
              <div key={sub.id} className="sub-row">
                <div style={{
                  width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                  background: `${subjectColor(i)}18`, border: `1px solid ${subjectColor(i)}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: subjectColor(i) }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: ".88rem", fontWeight: 700, color: COLORS.textPrimary, marginBottom: ".15rem" }}>{sub.name}</p>
                  <p style={{ fontSize: ".72rem", color: COLORS.textFaint }}>{fmtDuration(sub.duration_sec)}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span className="num" style={{ fontFamily: FONTS.display, fontSize: "1.1rem", fontWeight: 800, color: subjectColor(i) }}>{sub.max_score}</span>
                  <span style={{ fontSize: ".7rem", color: COLORS.textFaint, marginLeft: ".25rem" }}>балл.</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Profile subject tiles ── */}
        {!loading && profile.length > 0 && (
          <>
            <div className="fu3" style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.textFaint }}>
                Профильный предмет
              </p>
            </div>

            <div className="fu3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {profile.map((sub, i) => {
                const color    = subjectColor(mandatory.length + i);
                const bgColor  = subjectBg(mandatory.length + i);
                const isSel    = selectedSlug === sub.slug;

                return (
                  <button
                    key={sub.slug}
                    className={`profile-tile${isSel ? " sel" : ""}`}
                    style={{ borderColor: isSel ? color : "transparent", boxShadow: isSel ? `0 0 0 1px ${color}40, 0 16px 40px rgba(0,0,0,0.5)` : undefined }}
                    onClick={() => setSelectedSlug(sub.slug)}
                  >
                    {/* Gradient background */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: `radial-gradient(ellipse at 30% 20%, ${color}30 0%, transparent 65%), ${bgColor}`,
                    }} />

                    {/* Noise texture overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, transparent 60%)",
                    }} />

                    {/* Bottom dark fade */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
                    }} />

                    {/* Top-right checkmark */}
                    <div style={{
                      position: "absolute", top: "12px", right: "12px",
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: isSel ? color : "rgba(255,255,255,0.1)",
                      border: `1.5px solid ${isSel ? color : "rgba(255,255,255,0.2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .18s",
                    }}>
                      {isSel && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.2 2.2L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>

                    {/* Color accent line at top */}
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0,
                      height: "3px",
                      background: color,
                      opacity: isSel ? 1 : 0.4,
                      transition: "opacity .18s",
                    }} />

                    {/* Content */}
                    <div style={{ position: "absolute", bottom: "1.1rem", left: "1.1rem", right: "1.1rem" }}>
                      <p style={{ fontFamily: FONTS.display, fontSize: "1.05rem", fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: ".4rem" }}>
                        {sub.name}
                      </p>
                      <p style={{ fontSize: ".72rem", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                        {sub.max_score} балл. · {fmtDuration(sub.duration_sec)}
                      </p>
                      {sub.description && (
                        <p style={{ fontSize: ".68rem", color: "rgba(255,255,255,0.35)", marginTop: ".2rem", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                          {sub.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Summary + start ── */}
        {!loading && (
          <div className="fu4" style={{
            background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: "16px", padding: "1.25rem 1.75rem",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
          }}>
            <div style={{ display: "flex", gap: "2.5rem" }}>
              <div>
                <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".25rem" }}>Время</p>
                <p className="num" style={{ fontFamily: FONTS.display, fontSize: "1.3rem", fontWeight: 800, color: COLORS.textPrimary }}>
                  {totalDuration > 0 ? fmtDuration(totalDuration) : "—"}
                </p>
              </div>
              <div>
                <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".25rem" }}>Макс. баллов</p>
                <p className="num" style={{ fontFamily: FONTS.display, fontSize: "1.3rem", fontWeight: 800, color: COLORS.textPrimary }}>
                  {totalScore > 0 ? totalScore : "—"}
                </p>
              </div>
            </div>

            <button
              className="btn-start"
              disabled={profile.length > 0 && !selectedSlug}
              onClick={handleStart}
            >
              Начать экзамен →
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
