// src/pages/Courses/CategoryPage.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { API_BASE, mediaUrl } from "@/api/auth";
import type { ApiCategory, ApiCourse } from "./Courses";

const COLORS = {
  bgPage: "#0D0D11", bgCard: "#13131A", bgCardHover: "#161620",
  border: "rgba(255,255,255,0.07)", borderHover: "rgba(255,58,58,0.3)",
  accent: "#FF3A3A", textPrimary: "#FAFAFF", textBody: "#F0F0FF",
  textMuted: "#8888AA", textFaint: "#44445A",
};
const FONTS = {
  display: "'Syne', sans-serif",
  body: "'Nunito', sans-serif",
  googleUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Nunito:wght@400;600;700&display=swap",
};

const PALETTE = ["#FF3A3A", "#3A8EFF", "#FF9F3A", "#3AFFB4", "#B43AFF"];
function slugColor(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

interface ApiLesson {
  id:       number;
  title:    string;
  auto_test:boolean;
  priority: number;
}

export default function CategoryPage() {
  const { categoryCode } = useParams<{ categoryCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const stateCategory = (location.state as { category?: ApiCategory } | null)?.category;
  const [category,     setCategory]     = useState<ApiCategory | null>(stateCategory ?? null);
  const [loading,      setLoading]      = useState(!stateCategory);
  const [lessonsMap,   setLessonsMap]   = useState<Record<string, ApiLesson[]>>({});
  const [lessonsLoading, setLessonsLoading] = useState<Record<string, boolean>>({});
  const [expanded,     setExpanded]     = useState<Record<string, boolean>>({});

  // 1. Загружаем категорию если нет в state
  useEffect(() => {
    if (stateCategory) return;
    fetch(`${API_BASE}/courses/categories/?page_size=100`)
      .then(r => r.ok ? r.json() : { result: [] })
      .then(data => {
        const found = (data.result as ApiCategory[]).find(c => c.code === categoryCode);
        setCategory(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryCode, stateCategory]);

  // 2. Когда категория загружена — грузим уроки всех модулей параллельно
  useEffect(() => {
    if (!category || category.courses.length === 0) return;

    const initExpanded: Record<string, boolean> = {};
    const initLoading:  Record<string, boolean> = {};
    category.courses.forEach(m => {
      initExpanded[m.slug] = true;
      initLoading[m.slug]  = true;
    });
    setExpanded(initExpanded);
    setLessonsLoading(initLoading);

    category.courses.forEach(mod => {
      fetch(`${API_BASE}/courses/${mod.slug}/lessons/`)
        .then(r => r.ok ? r.json() : [])
        .then((data: ApiLesson[]) => {
          setLessonsMap(prev => ({ ...prev, [mod.slug]: data }));
        })
        .catch(() => {
          setLessonsMap(prev => ({ ...prev, [mod.slug]: [] }));
        })
        .finally(() => {
          setLessonsLoading(prev => ({ ...prev, [mod.slug]: false }));
        });
    });
  }, [category]);

  const toggleExpand = (slug: string) =>
    setExpanded(prev => ({ ...prev, [slug]: !prev[slug] }));

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div style={{ background: COLORS.bgPage, minHeight: "100vh", fontFamily: FONTS.body }}>
        <style>{`@keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}.skel{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.04) 75%);background-size:1200px 100%;animation:shimmer 1.4s infinite;border-radius:8px}`}</style>
        <DashboardNav />
        <main style={{ maxWidth: "900px", margin: "0 auto", padding: "3.5rem 2rem" }}>
          <div className="skel" style={{ height: "13px", width: "80px", marginBottom: "1rem" }} />
          <div className="skel" style={{ height: "36px", width: "280px", marginBottom: ".75rem" }} />
          <div className="skel" style={{ height: "15px", width: "220px", marginBottom: "2.5rem" }} />
          {[0,1,2].map(i => (
            <div key={i} className="skel" style={{ height: "120px", marginBottom: ".75rem" }} />
          ))}
        </main>
      </div>
    );
  }

  if (!category) {
    return (
      <div style={{ background: COLORS.bgPage, minHeight: "100vh" }}>
        <DashboardNav />
        <div style={{ padding: "3rem 2rem", color: "#fff" }}>Курс не найден</div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}

        .lesson-row{display:flex;align-items:center;justify-content:space-between;padding:.7rem 1rem;border-radius:8px;cursor:pointer;transition:background .15s;gap:1rem}
        .lesson-row:hover{background:rgba(255,255,255,0.04)}
        .lesson-arrow{color:${COLORS.textFaint};font-size:.85rem;transition:transform .15s,color .15s;flex-shrink:0}
        .lesson-row:hover .lesson-arrow{transform:translateX(3px);color:${COLORS.accent}}

        .toggle-btn{background:none;border:none;cursor:pointer;color:${COLORS.textFaint};padding:.25rem .4rem;border-radius:6px;transition:color .15s,background .15s;display:flex;align-items:center;font-size:.75rem}
        .toggle-btn:hover{color:${COLORS.textBody};background:rgba(255,255,255,0.06)}

        @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
        .skel{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.04) 75%);background-size:1200px 100%;animation:shimmer 1.4s infinite;border-radius:8px}
      `}</style>

      <DashboardNav />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "3.5rem 2rem" }}>

        {/* Breadcrumb */}
        <div className="fade-up-1" style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".75rem", color: COLORS.textFaint, marginBottom: "1.5rem" }}>
          <span
            style={{ cursor: "pointer", transition: "color .15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = COLORS.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = COLORS.textFaint)}
            onClick={() => navigate("/courses")}
          >
            Курсы
          </span>
          <span>/</span>
          <span style={{ color: COLORS.textMuted }}>{category.name}</span>
        </div>

        {/* Header */}
        <div className="fade-up-2">
          <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".5rem" }}>
            Курс
          </p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(1.8rem,3.5vw,2.4rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary, marginBottom: ".5rem" }}>
            {category.name}
          </h1>
          {category.description && (
            <p style={{ fontSize: ".9rem", color: COLORS.textMuted, marginBottom: "2.5rem" }}>
              {category.description}
            </p>
          )}
          {!category.description && <div style={{ marginBottom: "2.5rem" }} />}
        </div>

        {/* Модули с уроками */}
        {category.courses.length === 0 ? (
          <div style={{ color: COLORS.textFaint, fontSize: ".85rem", fontStyle: "italic" }}>Модули скоро появятся</div>
        ) : (
          <div className="fade-up-3" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {category.courses.map((mod: ApiCourse) => {
              const color    = slugColor(mod.slug);
              const imgUrl   = mediaUrl(mod.image);
              const lessons  = lessonsMap[mod.slug] ?? [];
              const isLoading = lessonsLoading[mod.slug] ?? false;
              const isOpen   = expanded[mod.slug] ?? true;

              return (
                <div key={mod.slug} style={{
                  background: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "14px",
                  overflow: "hidden",
                }}>

                  {/* Заголовок модуля */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "1.1rem 1.25rem",
                    borderBottom: isOpen ? `1px solid ${COLORS.border}` : "none",
                    gap: "1rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      {imgUrl ? (
                        <img src={imgUrl} alt="" style={{ width: "40px", height: "40px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: color }} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontFamily: FONTS.display, fontSize: "1rem", fontWeight: 800, color: COLORS.textPrimary }}>
                          {mod.name}
                        </div>
                        {mod.description && (
                          <div style={{ fontSize: ".75rem", color: COLORS.textFaint, marginTop: ".15rem" }}>
                            {mod.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      className="toggle-btn"
                      onClick={() => toggleExpand(mod.slug)}
                      title={isOpen ? "Свернуть" : "Развернуть"}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                        style={{ transition: "transform .2s", transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>
                        <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  {/* Список уроков */}
                  {isOpen && (
                    <div style={{ padding: ".5rem" }}>
                      {isLoading ? (
                        <div style={{ padding: ".5rem .5rem .25rem" }}>
                          {[0,1,2].map(i => (
                            <div key={i} className="skel" style={{ height: "38px", marginBottom: ".4rem" }} />
                          ))}
                        </div>
                      ) : lessons.length === 0 ? (
                        <div style={{ padding: ".75rem 1rem", fontSize: ".82rem", color: COLORS.textFaint, fontStyle: "italic" }}>
                          Уроки скоро появятся
                        </div>
                      ) : (
                        lessons.map((lesson, i) => (
                          <div
                            key={lesson.id}
                            className="lesson-row"
                            onClick={() => navigate(`/courses/${mod.slug}/${lesson.id}`, {
                              state: {
                                courseName:   mod.name,
                                categoryName: category.name,
                                categoryCode: category.code,
                              },
                            })}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                              <span style={{ fontSize: ".65rem", fontWeight: 800, color: COLORS.textFaint, width: "20px", flexShrink: 0, textAlign: "right" }}>
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span style={{ fontSize: ".85rem", fontWeight: 600, color: COLORS.textBody }}>
                                {lesson.title}
                              </span>
                              {lesson.auto_test && (
                                <span style={{ fontSize: ".62rem", color: COLORS.textFaint, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                                  тест
                                </span>
                              )}
                            </div>
                            <span className="lesson-arrow">→</span>
                          </div>
                        ))
                      )}
                    </div>
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
