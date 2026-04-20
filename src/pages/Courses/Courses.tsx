// src/pages/Courses/Courses.tsx — список категорий (= курсов на фронте)

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { API_BASE, mediaUrl } from "@/api/auth";

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
function codeColor(code: string): string {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
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
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/courses/categories/?page_size=100`)
      .then(r => r.ok ? r.json() : { result: [] })
      .then(data => setCategories(data.result ?? []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .course-card{background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:14px;padding:1.25rem 1.5rem;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:space-between;gap:1rem}
        .course-card:hover{border-color:${COLORS.borderHover};transform:translateY(-2px);background:${COLORS.bgCardHover}}
        .course-arrow{color:${COLORS.textFaint};transition:transform .18s,color .18s;font-size:1rem;flex-shrink:0}
        .course-card:hover .course-arrow{transform:translateX(4px);color:${COLORS.accent}}
      `}</style>

      <DashboardNav />

      <main className="dash-main" style={{ maxWidth: "900px", margin: "0 auto", padding: "3.5rem 2rem" }}>
        <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".5rem" }}>
          Обучение
        </p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(1.8rem,3.5vw,2.4rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary, marginBottom: ".5rem" }}>
          Все курсы
        </h1>
        <p style={{ fontSize: ".9rem", color: COLORS.textMuted, marginBottom: "2.5rem" }}>
          Выбери курс и начни изучение
        </p>

        {loading && (
          <div style={{ color: COLORS.textFaint, fontSize: ".85rem" }}>Загрузка...</div>
        )}

        {!loading && categories.length === 0 && (
          <div style={{ color: COLORS.textFaint, fontSize: ".85rem", fontStyle: "italic" }}>Курсы не найдены</div>
        )}

        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            {categories.map(cat => {
              const color  = codeColor(cat.code);
              const imgUrl = mediaUrl(cat.image);
              const modCount = cat.courses.length;

              return (
                <div
                  key={cat.code}
                  className="course-card"
                  onClick={() => navigate(`/courses/c/${cat.code}`, { state: { category: cat } })}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt="" style={{ width: "44px", height: "44px", borderRadius: "12px", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: "14px", height: "14px", borderRadius: "3px", background: color }} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontFamily: FONTS.display, fontSize: "1.05rem", fontWeight: 800, color: COLORS.textPrimary, marginBottom: ".25rem" }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: ".75rem", color: COLORS.textFaint }}>
                        {modCount === 0
                          ? "Скоро"
                          : `${modCount} ${modCount === 1 ? "модуль" : modCount < 5 ? "модуля" : "модулей"}`}
                      </div>
                    </div>
                  </div>
                  <span className="course-arrow">→</span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
