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

const PALETTE    = ["#3A8EFF", "#FF3A3A", "#3AFFB4", "#FF9F3A", "#B43AFF", "#FF6B6B", "#3AFFEF"];
const subjectColor = (i: number) => PALETTE[i % PALETTE.length];

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
  const [search,           setSearch]           = useState("");
  const [fadingProfile,    setFadingProfile]    = useState(false);
  const [displayedProfile, setDisplayedProfile] = useState<ApiSubject[]>([]);
  const [profileGridMinH,  setProfileGridMinH]  = useState(0);
  const profileGridRef = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (profileGridRef.current && profile.length > 0) {
      setProfileGridMinH(profileGridRef.current.offsetHeight);
    }
  }, [profile.length]);

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
        setDisplayedProfile(p);
        if (p.length > 0) setSelectedSlug(p[0].slug);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  function handleSearchProfile(q: string) {
    setSearch(q);
    setFadingProfile(true);
    setTimeout(() => {
      setDisplayedProfile(profile.filter(s => s.name.toLowerCase().includes(q.toLowerCase())));
      setFadingProfile(false);
    }, 150);
  }

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

        .num{font-variant-numeric:tabular-nums lining-nums;font-feature-settings:"tnum","lnum"}

        .subj-card{
          border-radius:16px;overflow:hidden;
          display:flex;flex-direction:column;
          background:${COLORS.bgCard};
          border:1px solid ${COLORS.border};
        }

        .profile-tile{
          width:100%;
          border-radius:16px;overflow:hidden;
          display:flex;flex-direction:column;
          background:${COLORS.bgCard};
          border:1px solid ${COLORS.border};
          cursor:pointer;text-align:left;
          transition:border-color .2s, transform .2s, box-shadow .2s;
        }
        .profile-tile:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(0,0,0,0.35)}
        .profile-tile.sel{transform:translateY(-3px)}

        .btn-start{
          width:100%;background:${COLORS.accent};color:#fff;border:none;
          padding:.9rem 2.25rem;border-radius:12px;
          font-family:${FONTS.body};font-weight:700;font-size:1rem;
          cursor:pointer;transition:all .18s;
          letter-spacing:.01em;
        }
        .btn-start:hover:not(:disabled){background:#FF5555;transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,58,58,0.35)}
        .btn-start:disabled{opacity:.45;cursor:not-allowed}

        .p-search{
          width:100%;background:${COLORS.bgCard};border:1px solid ${COLORS.border};
          border-radius:12px;padding:.75rem 1rem .75rem 2.75rem;
          color:${COLORS.textPrimary};font-family:${FONTS.body};font-size:.9rem;
          outline:none;transition:border-color .2s;
        }
        .p-search:focus{border-color:rgba(255,255,255,0.22)}
        .p-search::placeholder{color:${COLORS.textFaint}}

        .stat-box{
          background:${COLORS.bgCard};border:1px solid ${COLORS.border};
          border-radius:14px;padding:1.1rem 1.5rem;flex:1;
        }

        @media(max-width:768px){
          .subj-grid{grid-template-columns:1fr !important}
          .profile-grid{grid-template-columns:1fr 1fr !important}
          .stats-row{flex-direction:column !important}
        }
        @media(max-width:480px){
          .profile-grid{grid-template-columns:1fr !important}
        }
        .profile-grid{transition:opacity .15s ease,transform .15s ease}
        .profile-grid.fading{opacity:0 !important;transform:translateY(4px) !important}
        @keyframes cardIn{from{opacity:0;transform:translateY(6px) scale(0.97)}to{opacity:1;transform:none}}
        .subj-card,.profile-tile{animation:cardIn .25s ease both}
      `}</style>

      <DashboardNav />

      <main className="exam-page-main" style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 3rem" }}>

        {/* ── Hero ── */}
        <div className="fade-up-1" style={{
          position: "relative",
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "20px",
          padding: "2.5rem 2.5rem",
          marginBottom: "1.5rem",
          overflow: "hidden",
        }}>
          <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".6rem" }}>
            Экзамен КТ
          </p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: "-.03em", color: COLORS.textPrimary, lineHeight: 1.1, marginBottom: ".75rem" }}>
            Комплексное тестирование
          </h1>
          <p style={{ fontSize: ".9rem", color: COLORS.textMuted, maxWidth: "520px", lineHeight: 1.6 }}>
            Выберите профильный предмет, ознакомьтесь с условиями и начните экзамен. Обязательные блоки включены автоматически.
          </p>
        </div>

        {/* ── Stats row ── */}
        {!loading && (
          <div className="fade-up-2 stats-row" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="stat-box">
              <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".4rem" }}>Общее время</p>
              <p className="num" style={{ fontFamily: FONTS.display, fontSize: "1.6rem", fontWeight: 800, color: COLORS.textPrimary }}>
                {totalDuration > 0 ? fmtDuration(totalDuration) : "—"}
              </p>
            </div>
            <div className="stat-box">
              <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".4rem" }}>Макс. баллов</p>
              <p className="num" style={{ fontFamily: FONTS.display, fontSize: "1.6rem", fontWeight: 800, color: COLORS.textPrimary }}>
                {totalScore > 0 ? totalScore : "—"}
              </p>
            </div>
            <div className="stat-box">
              <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".4rem" }}>Предметов</p>
              <p className="num" style={{ fontFamily: FONTS.display, fontSize: "1.6rem", fontWeight: 800, color: COLORS.textPrimary }}>
                {allSelected.length > 0 ? allSelected.length : "—"}
              </p>
            </div>
          </div>
        )}

        {/* ── Mandatory subjects ── */}
        <div className="fade-up-3" style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: "1rem" }}>
            Обязательные предметы
          </p>

          {loading ? (
            <div className="subj-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1rem" }}>
              {[0,1].map(i => (
                <div key={i} className="skel" style={{ height: "160px", borderRadius: "16px" }} />
              ))}
            </div>
          ) : (
            <div className="subj-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1rem" }}>
              {mandatory.map((sub, i) => {
                const color = subjectColor(i);
                return (
                  <div key={sub.id} className="subj-card">
                    {/* Banner */}
                    <div style={{
                      height: "120px",
                      background: COLORS.bgCard,
                      borderBottom: `1px solid ${COLORS.border}`,
                      position: "relative",
                      display: "flex",
                      alignItems: "flex-end",
                      padding: ".9rem 1.1rem",
                      flexShrink: 0,
                    }}>
                        <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: "1rem", color: "#FAFAFF", letterSpacing: "-.01em" }}>
                        {sub.name}
                      </span>
                      <span style={{
                        position: "absolute", top: ".65rem", right: ".65rem",
                        fontSize: ".58rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                        background: "rgba(255,255,255,.08)", color: COLORS.textFaint,
                        padding: ".2rem .55rem", borderRadius: "20px",
                      }}>
                        Обязательный
                      </span>
                    </div>
                    {/* Body */}
                    <div style={{ padding: ".85rem 1.1rem 1rem", display: "flex", flexDirection: "column", gap: ".4rem", flex: 1 }}>
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <span style={{ fontSize: ".75rem", color: COLORS.textFaint, fontWeight: 600 }}>{fmtDuration(sub.duration_sec)}</span>
                        <span style={{ fontSize: ".75rem", fontWeight: 800, color: color }}>{sub.max_score} балл.</span>
                      </div>
                      {sub.description && (
                        <p style={{ fontSize: ".78rem", color: COLORS.textMuted, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                          {sub.description}
                        </p>
                      )}
                      {/* Progress bar — always full for mandatory */}
                      <div style={{ marginTop: "auto", paddingTop: ".5rem" }}>
                        <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "100%", background: color, borderRadius: "99px" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Start button + search ── */}
        {!loading && (
          <div className="fade-up-4" style={{ marginBottom: "2rem" }}>
            <button
              className="btn-start"
              disabled={profile.length > 0 && !selectedSlug}
              onClick={handleStart}
            >
              Начать экзамен
            </button>

            {profile.length > 0 && (
              <div style={{ position: "relative", marginTop: "1rem" }}>
                <svg style={{ position: "absolute", left: ".9rem", top: "50%", transform: "translateY(-50%)", opacity: .4, pointerEvents: "none" }} width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="#FAFAFF" strokeWidth="1.6"/>
                  <path d="M13 13l3.5 3.5" stroke="#FAFAFF" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <input
                  className="p-search"
                  type="text"
                  placeholder="Поиск профильного предмета..."
                  value={search}
                  onChange={e => handleSearchProfile(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Profile subject tiles ── */}
        {!loading && profile.length > 0 && (
          <div className="fade-up-4">
            <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: "1rem" }}>
              Профильный предмет — выберите один
            </p>

            <div ref={profileGridRef} className={`profile-grid${fadingProfile ? " fading" : ""}`} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", minHeight: search ? profileGridMinH : undefined }}>
              {displayedProfile.map((sub, i) => {
                const color   = subjectColor(mandatory.length + i);
                const isSel   = selectedSlug === sub.slug;

                return (
                  <button
                    key={sub.slug}
                    className={`profile-tile${isSel ? " sel" : ""}`}
                    style={{
                      borderColor: isSel ? color : undefined,
                      boxShadow: isSel ? `0 8px 32px rgba(0,0,0,0.35)` : undefined,
                    }}
                    onClick={() => setSelectedSlug(sub.slug)}
                  >
                    {/* Banner */}
                    <div style={{
                      height: "120px",
                      background: COLORS.bgCard,
                      borderBottom: `1px solid ${COLORS.border}`,
                      position: "relative",
                      display: "flex",
                      alignItems: "flex-end",
                      padding: ".9rem 1.1rem",
                      flexShrink: 0,
                    }}>
                      <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: "1rem", color: "#FAFAFF", letterSpacing: "-.01em" }}>
                        {sub.name}
                      </span>
                    </div>
                    {/* Body */}
                    <div style={{ padding: ".85rem 1.1rem 1rem", display: "flex", flexDirection: "column", gap: ".4rem", flex: 1 }}>
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <span style={{ fontSize: ".75rem", color: COLORS.textFaint, fontWeight: 600 }}>{fmtDuration(sub.duration_sec)}</span>
                        <span style={{ fontSize: ".75rem", fontWeight: 800, color: color }}>{sub.max_score} балл.</span>
                      </div>
                      {sub.description && (
                        <p style={{ fontSize: ".78rem", color: COLORS.textMuted, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                          {sub.description}
                        </p>
                      )}
                      {/* Progress bar */}
                      <div style={{ marginTop: "auto", paddingTop: ".5rem" }}>
                        <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: isSel ? "100%" : "0%", background: color, borderRadius: "99px", transition: "width .4s ease" }} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="skel" style={{ height: "190px", borderRadius: "16px" }} />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
