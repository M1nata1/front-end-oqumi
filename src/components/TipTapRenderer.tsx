// src/components/TipTapRenderer.tsx
// Shared TipTap JSON → React renderer for questions and content blocks.

import React from "react";

export interface TTNodeDef {
  type?:    string;
  text?:    unknown;
  content?: TTNodeDef[];
  marks?:   { type: string; attrs?: Record<string, unknown> }[];
  attrs?:   Record<string, unknown>;
}

export function TTNode({ n }: { n: TTNodeDef }): React.ReactElement | null {
  if (n.type === "text") {
    let el: React.ReactNode = typeof n.text === "string" ? n.text : "";
    for (const m of n.marks ?? []) {
      if (m.type === "bold")      el = <strong>{el}</strong>;
      if (m.type === "italic")    el = <em>{el}</em>;
      if (m.type === "strike")    el = <s>{el}</s>;
      if (m.type === "underline") el = <u>{el}</u>;
      if (m.type === "code")      el = <code style={{ background: "rgba(255,255,255,0.08)", borderRadius: "4px", padding: "0 .3em", fontFamily: "ui-monospace,monospace", fontSize: ".85em" }}>{el}</code>;
      if (m.type === "textStyle" && m.attrs?.color)
        el = <span style={{ color: m.attrs.color as string }}>{el}</span>;
    }
    return <>{el}</>;
  }

  const kids = Array.isArray(n.content)
    ? n.content.map((c, i) => <TTNode key={i} n={c} />)
    : null;

  switch (n.type) {
    case "doc":         return <>{kids}</>;
    case "paragraph":   return <p style={{ marginBottom: ".65rem", lineHeight: 1.65 }}>{kids}</p>;
    case "hardBreak":   return <br />;
    case "heading": {
      const lv  = (n.attrs?.level as number) ?? 2;
      const Tag = `h${lv}` as "h1"|"h2"|"h3"|"h4"|"h5"|"h6";
      return <Tag style={{ fontWeight: 800, marginBottom: ".5rem", lineHeight: 1.3 }}>{kids}</Tag>;
    }
    case "bulletList":  return <ul style={{ paddingLeft: "1.4rem", marginBottom: ".65rem" }}>{kids}</ul>;
    case "orderedList": return <ol style={{ paddingLeft: "1.4rem", marginBottom: ".65rem" }}>{kids}</ol>;
    case "listItem":    return <li style={{ marginBottom: ".25rem" }}>{kids}</li>;
    case "blockquote":  return (
      <blockquote style={{ borderLeft: "3px solid rgba(255,255,255,0.12)", paddingLeft: ".9rem", color: "#B4B4D8", marginBottom: ".65rem" }}>
        {kids}
      </blockquote>
    );
    case "codeBlock":   return (
      <pre style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: ".75rem 1rem", marginBottom: ".65rem", overflowX: "auto" }}>
        <code style={{ fontFamily: "ui-monospace,monospace", fontSize: ".82rem", color: "#7BB8FF" }}>{kids}</code>
      </pre>
    );
    case "table":       return (
      <div style={{ overflowX: "auto", marginBottom: ".75rem" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: ".85rem" }}>
          <tbody>{kids}</tbody>
        </table>
      </div>
    );
    case "tableRow":    return <tr>{kids}</tr>;
    case "tableHeader": return (
      <th style={{ border: "1px solid rgba(255,255,255,0.1)", padding: ".45rem .75rem", background: "rgba(255,255,255,0.05)", fontWeight: 700, textAlign: "left", color: "#FAFAFF" }}>
        {kids}
      </th>
    );
    case "tableCell":   return (
      <td style={{ border: "1px solid rgba(255,255,255,0.07)", padding: ".45rem .75rem", verticalAlign: "top" }}>
        {kids}
      </td>
    );
    default:            return <>{kids}</>;
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
