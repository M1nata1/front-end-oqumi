// src/components/TipTapRenderer.tsx
// Shared TipTap JSON → React renderer.
// Supports every node/mark produced by the project's TipTap editor.

import React from "react";

export interface TTNodeDef {
  type?:    string;
  text?:    unknown;
  content?: TTNodeDef[];
  marks?:   { type: string; attrs?: Record<string, unknown> }[];
  attrs?:   Record<string, unknown>;
}

export function TTNode({ n }: { n: TTNodeDef }): React.ReactElement | null {
  // ── Text leaf ────────────────────────────────────────────────
  if (n.type === "text") {
    let el: React.ReactNode = typeof n.text === "string" ? n.text : "";
    for (const m of n.marks ?? []) {
      switch (m.type) {
        case "bold":      el = <strong>{el}</strong>; break;
        case "italic":    el = <em>{el}</em>; break;
        case "strike":    el = <s>{el}</s>; break;
        case "underline": el = <u>{el}</u>; break;
        case "code":      el = <code style={{ background: "rgba(255,255,255,0.08)", borderRadius: "4px", padding: "0 .3em", fontFamily: "ui-monospace,monospace", fontSize: ".85em" }}>{el}</code>; break;
        case "textStyle":
          if (m.attrs?.color) el = <span style={{ color: m.attrs.color as string }}>{el}</span>;
          break;
        case "link": {
          const href = (m.attrs?.href as string) ?? "#";
          el = <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#7BB8FF", textDecoration: "underline", textUnderlineOffset: "3px" }}>{el}</a>;
          break;
        }
      }
    }
    return <>{el}</>;
  }

  // ── Container nodes ──────────────────────────────────────────
  const kids = Array.isArray(n.content)
    ? n.content.map((c, i) => <TTNode key={i} n={c} />)
    : null;

  const align = n.attrs?.textAlign as string | null | undefined;
  const textAlign = (align ?? undefined) as React.CSSProperties["textAlign"];

  switch (n.type) {
    case "doc": return <>{kids}</>;

    case "paragraph":
      return <p style={{ marginBottom: ".65rem", lineHeight: 1.65, textAlign }}>{kids}</p>;

    case "hardBreak": return <br />;

    case "horizontalRule":
      return <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1.25rem 0" }} />;

    case "heading": {
      const lv  = (n.attrs?.level as number) ?? 2;
      const Tag = `h${lv}` as "h1"|"h2"|"h3"|"h4"|"h5"|"h6";
      const sizes: Record<number, string> = { 1: "1.75rem", 2: "1.4rem", 3: "1.15rem" };
      return (
        <Tag style={{ fontWeight: 800, marginBottom: ".5rem", lineHeight: 1.3, textAlign, fontSize: sizes[lv] ?? "1rem" }}>
          {kids}
        </Tag>
      );
    }

    case "bulletList":
      return <ul style={{ paddingLeft: "1.4rem", marginBottom: ".65rem", lineHeight: 1.7, listStyleType: "disc" }}>{kids}</ul>;

    case "orderedList": {
      const start = (n.attrs?.start as number) ?? 1;
      return <ol start={start} style={{ paddingLeft: "1.4rem", marginBottom: ".65rem", lineHeight: 1.7, listStyleType: "decimal" }}>{kids}</ol>;
    }

    case "listItem":
      return <li style={{ marginBottom: ".2rem", display: "list-item" }}>{kids}</li>;

    case "blockquote":
      return (
        <blockquote style={{ borderLeft: "3px solid rgba(255,255,255,0.15)", paddingLeft: ".9rem", color: "#B4B4D8", marginBottom: ".65rem", fontStyle: "italic" }}>
          {kids}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: ".75rem 1rem", marginBottom: ".65rem", overflowX: "auto" }}>
          <code style={{ fontFamily: "ui-monospace,monospace", fontSize: ".82rem", color: "#7BB8FF" }}>{kids}</code>
        </pre>
      );

    case "image": {
      const src   = (n.attrs?.src as string) ?? "";
      const alt   = (n.attrs?.alt as string) ?? "";
      const title = (n.attrs?.title as string) ?? undefined;
      return (
        <img
          src={src} alt={alt} title={title}
          style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: ".75rem", display: "block" }}
        />
      );
    }

    case "table":
      return (
        <div style={{ overflowX: "auto", marginBottom: ".75rem" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: ".85rem" }}>
            <tbody>{kids}</tbody>
          </table>
        </div>
      );

    case "tableRow":    return <tr>{kids}</tr>;

    case "tableHeader":
      return (
        <th style={{ border: "1px solid rgba(255,255,255,0.1)", padding: ".45rem .75rem", background: "rgba(255,255,255,0.05)", fontWeight: 700, textAlign: "left", color: "#FAFAFF" }}>
          {kids}
        </th>
      );

    case "tableCell":
      return (
        <td style={{ border: "1px solid rgba(255,255,255,0.07)", padding: ".45rem .75rem", verticalAlign: "top" }}>
          {kids}
        </td>
      );

    default: return <>{kids}</>;
  }
}

/** Renders any TipTap content value regardless of wrapping format. */
export function TipTapContent({ content }: { content: unknown }): React.ReactElement | null {
  if (typeof content === "string") return <>{content}</>;
  if (!content || typeof content !== "object") return null;
  const obj = content as TTNodeDef;

  // { type: "text", text: "plain string" }
  if (typeof obj.text === "string") return <>{obj.text}</>;

  // { type: "text", text: { type: "doc", ... } }  — nested doc inside text field
  if (obj.text && typeof obj.text === "object") return <TipTapContent content={obj.text} />;

  // { content: { type: "doc", ... } }  — double-wrapped (no outer type)
  const node = (!obj.type && obj.content && typeof obj.content === "object" && !Array.isArray(obj.content))
    ? (obj.content as TTNodeDef)
    : obj;

  return <TTNode n={node} />;
}
