// src/pages/Courses/Courses.tsx — список категорий (= курсов на фронте)

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { API_BASE, mediaUrl } from "@/api/auth";

const COLORS = {
  bgPage: "#0D0D11", bgCard: "#13131A", bgCardHover: "#161620",
  border: "rgba(255,255,255,0.07)", borderHover: "rgba(255,255,255,0.14)",
  accent: "#FF3A3A", textPrimary: "#FAFAFF", textBody: "#F0F0FF",
  textMuted: "#B4B4D8", textFaint: "#7878A8",
};
const FONTS = {
  display: "'Syne', sans-serif",
  body: "'Nunito', sans-serif",
  googleUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Nunito:wght@400;600;700&display=swap",
};

const BANNER_PALETTE: { bg: string; bar: string }[] = [
  { bg: "#0F2F5C", bar: "#3A8EFF" },
  { bg: "#5C0F0F", bar: "#FF3A3A" },
  { bg: "#0F5C25", bar: "#3AFFB4" },
  { bg: "#4A3A0A", bar: "#FF9F3A" },
  { bg: "#3A0F5C", bar: "#B43AFF" },
  { bg: "#0F4A4A", bar: "#3AFFEF" },
  { bg: "#5C3A0F", bar: "#FFD03A" },
];
function catPalette(code: string) {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return BANNER_PALETTE[h % BANNER_PALETTE.length];
}

const VISITED_KEY = "oqumi_visited_categories";
function loadVisited(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(VISITED_KEY) ?? "[]")); }
  catch { return new Set(); }
}
function saveVisited(v: Set<string>) {
  localStorage.setItem(VISITED_KEY, JSON.stringify([...v]));
}

export interface ApiCourse {
  slug:        string;
  name:        string;
  description: string;
  image:       string | null;
  is_free:     boolean;
  cost:        string | null;
}

export interface ApiCategory {
  code:        string;
  name:        string;
  description: string;
  image:       string | null;
  courses:     ApiCourse[];
}

export default function Courses() {
  const navigate  = useNavigate();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [visited,    setVisited]    = useState<Set<string>>(loadVisited);

  useEffect(() => {
    fetch(`${API_BASE}/courses/categories/?page_size=100`)
      .then(r => r.ok ? r.json() : { result: [] })
      .then(data => setCategories(data.result ?? []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    categories.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
    ),
    [categories, search]
  );

  const visitedCount = categories.filter(c => visited.has(c.code)).length;

  function handleCardClick(cat: ApiCategory) {
    const next = new Set(visited);
    next.add(cat.code);
    setVisited(next);
    saveVisited(next);
    navigate(`/courses/c/${cat.code}`, { state: { category: cat } });
  }

  const pluralModules = (n: number) =>
    n === 1 ? "модуль" : n < 5 ? "модуля" : "модулей";

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .c-card{
          background:${COLORS.bgCard};
          border:1px solid ${COLORS.border};
          border-radius:16px;
          overflow:hidden;
          cursor:pointer;
          transition:border-color .2s, transform .2s, box-shadow .2s;
          display:flex;
          flex-direction:column;
        }
        .c-card:hover{
          border-color:${COLORS.borderHover};
          transform:translateY(-3px);
          box-shadow:0 8px 32px rgba(0,0,0,.35);
        }
        .c-search{
          width:100%;
          background:${COLORS.bgCard};
          border:1px solid ${COLORS.border};
          border-radius:12px;
          padding:.75rem 1rem .75rem 2.75rem;
          color:${COLORS.textPrimary};
          font-family:${FONTS.body};
          font-size:.9rem;
          outline:none;
          transition:border-color .2s;
        }
        .c-search:focus{border-color:rgba(255,255,255,0.22)}
        .c-search::placeholder{color:${COLORS.textFaint}}
        @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
        .skel{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.04) 75%);background-size:1200px 100%;animation:shimmer 1.4s infinite;border-radius:10px}
        @media(max-width:900px){ .c-grid{grid-template-columns:1fr 1fr !important} }
        @media(max-width:560px){ .c-grid{grid-template-columns:1fr !important} }
      `}</style>

      <DashboardNav />

      <main className="dash-main" style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 3rem" }}>

        {/* Header */}
        <p className="fade-up-1" style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".4rem" }}>
          Обучение
        </p>
        <h1 className="fade-up-2" style={{ fontFamily: FONTS.display, fontSize: "clamp(1.8rem,3.5vw,2.4rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary, marginBottom: "1.75rem" }}>
          Все курсы
        </h1>

        {/* Search + counter */}
        <div className="fade-up-3" style={{ position: "relative", marginBottom: ".65rem" }}>
          <svg style={{ position: "absolute", left: ".9rem", top: "50%", transform: "translateY(-50%)", opacity: .4, pointerEvents: "none" }} width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="#FAFAFF" strokeWidth="1.6"/>
            <path d="M13 13l3.5 3.5" stroke="#FAFAFF" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <input
            className="c-search"
            type="text"
            placeholder="Поиск курса..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {!loading && (
          <p className="fade-up-3" style={{ fontSize: ".75rem", color: COLORS.textFaint, marginBottom: "1.75rem" }}>
            {visitedCount === 0
              ? `${categories.length} ${pluralModules(categories.length)} доступно`
              : `Просмотрено ${visitedCount} из ${categories.length} ${categories.length < 5 ? "курсов" : "курсов"}`}
          </p>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="c-grid fade-up-4" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem" }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "16px", overflow: "hidden" }}>
                <div className="skel" style={{ height: "140px" }} />
                <div style={{ padding: "1.25rem" }}>
                  <div className="skel" style={{ height: "13px", width: "55%", marginBottom: ".65rem" }} />
                  <div className="skel" style={{ height: "11px", width: "80%", marginBottom: ".4rem" }} />
                  <div className="skel" style={{ height: "11px", width: "60%", marginBottom: "1.25rem" }} />
                  <div className="skel" style={{ height: "5px" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ color: COLORS.textFaint, fontSize: ".85rem", fontStyle: "italic" }}>
            {search ? "Ничего не найдено" : "Курсы не найдены"}
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="c-grid fade-up-4" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem" }}>
            {filtered.map(cat => {
              const { bg, bar } = catPalette(cat.code);
              const imgUrl      = mediaUrl(cat.image);
              const modCount    = cat.courses.length;
              const isVisited   = visited.has(cat.code);

              return (
                <div key={cat.code} className="c-card" onClick={() => handleCardClick(cat)}>

                  {/* Banner */}
                  <div style={{
                    height: "140px",
                    background: imgUrl
                      ? `url(${imgUrl}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)`,
                    position: "relative",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "1rem 1.25rem",
                  }}>
                    {imgUrl && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }} />
                    )}
                    <span style={{
                      position: "relative",
                      fontFamily: FONTS.display,
                      fontWeight: 800,
                      fontSize: "1.05rem",
                      color: "#FAFAFF",
                      letterSpacing: "-.01em",
                      textShadow: "0 1px 6px rgba(0,0,0,.5)",
                    }}>
                      {cat.name}
                    </span>
                    {isVisited && (
                      <span style={{
                        position: "absolute",
                        top: ".75rem",
                        right: ".75rem",
                        fontSize: ".6rem",
                        fontWeight: 700,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        background: "rgba(255,255,255,.12)",
                        backdropFilter: "blur(4px)",
                        color: "#FAFAFF",
                        padding: ".25rem .55rem",
                        borderRadius: "20px",
                      }}>
                        Просмотрено
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: "1.1rem 1.25rem 1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: ".6rem" }}>
                    <p style={{ fontSize: ".8rem", color: COLORS.textMuted, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {cat.description || "Изучи этот курс и прокачай навыки"}
                    </p>
                    <p style={{ fontSize: ".72rem", color: COLORS.textFaint, fontWeight: 600 }}>
                      {modCount === 0 ? "Скоро" : `${modCount} ${pluralModules(modCount)}`}
                    </p>

                    {/* Progress bar */}
                    <div style={{ marginTop: "auto", paddingTop: ".5rem" }}>
                      <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: isVisited ? "100%" : "0%",
                          background: bar,
                          borderRadius: "99px",
                          transition: "width .4s ease",
                        }} />
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
