import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const msg = this.state.error.message || "Неизвестная ошибка";

    return (
      <div style={{
        minHeight: "100vh", background: "#0D0D11",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Nunito', sans-serif", color: "#F0F0FF", padding: "2rem",
      }}>
        <div style={{
          maxWidth: "480px", width: "100%", textAlign: "center",
          background: "#13131A", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "20px", padding: "2.5rem 2rem",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: "1.25rem", color: "#FAFAFF", marginBottom: ".6rem",
          }}>
            Что-то пошло не так
          </h2>
          <p style={{ fontSize: ".82rem", color: "#7878A8", lineHeight: 1.6, marginBottom: "1.75rem" }}>
            {msg}
          </p>
          <div style={{ display: "flex", gap: ".75rem", justifyContent: "center" }}>
            <button
              onClick={this.reset}
              style={{
                background: "#FF3A3A", color: "#fff", border: "none",
                borderRadius: "10px", padding: ".65rem 1.5rem",
                fontFamily: "'Nunito', sans-serif", fontWeight: 700,
                fontSize: ".875rem", cursor: "pointer",
              }}
            >
              Попробовать снова
            </button>
            <button
              onClick={() => { this.reset(); window.location.href = "/courses"; }}
              style={{
                background: "transparent", color: "#B4B4D8",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", padding: ".65rem 1.5rem",
                fontFamily: "'Nunito', sans-serif", fontWeight: 600,
                fontSize: ".875rem", cursor: "pointer",
              }}
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }
}
