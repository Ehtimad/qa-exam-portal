import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { marked } from "marked";

const md = readFileSync("DOCUMENTATION.md", "utf8");
const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QA Exam Portal — Dokumentasiya</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    line-height: 1.65;
    color: #1e293b;
    background: #fff;
    padding: 48px 56px;
    max-width: 860px;
    margin: 0 auto;
  }

  /* Cover-style first heading */
  h1:first-of-type {
    font-size: 26px;
    font-weight: 700;
    color: #1e40af;
    border-bottom: 3px solid #1e40af;
    padding-bottom: 12px;
    margin-bottom: 28px;
    margin-top: 0;
  }

  h1 { font-size: 20px; font-weight: 700; color: #1e40af; margin: 36px 0 12px; }
  h2 { font-size: 16px; font-weight: 600; color: #1e3a5f; margin: 28px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  h3 { font-size: 14px; font-weight: 600; color: #334155; margin: 20px 0 8px; }
  h4 { font-size: 13px; font-weight: 600; color: #475569; margin: 16px 0 6px; }

  p { margin-bottom: 10px; }

  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }

  code {
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 11.5px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 1px 5px;
    color: #0f172a;
  }

  pre {
    background: #0f172a;
    border-radius: 8px;
    padding: 16px 18px;
    overflow-x: auto;
    margin: 12px 0 16px;
    border: 1px solid #1e293b;
  }
  pre code {
    background: transparent;
    border: none;
    padding: 0;
    color: #e2e8f0;
    font-size: 11px;
    line-height: 1.7;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 20px;
    font-size: 12.5px;
  }
  thead tr { background: #1e40af; color: #fff; }
  thead th { padding: 9px 12px; text-align: left; font-weight: 600; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:hover { background: #eff6ff; }
  td, th { padding: 8px 12px; border: 1px solid #e2e8f0; vertical-align: top; }
  tbody td:first-child { font-weight: 500; }

  /* Blockquotes */
  blockquote {
    border-left: 4px solid #3b82f6;
    background: #eff6ff;
    margin: 12px 0;
    padding: 10px 16px;
    border-radius: 0 6px 6px 0;
  }
  blockquote p { margin: 0; color: #1e40af; font-size: 12px; }

  ul, ol { margin: 8px 0 12px 22px; }
  li { margin-bottom: 4px; }
  li::marker { color: #3b82f6; }

  strong { font-weight: 600; color: #0f172a; }

  hr {
    border: none;
    border-top: 2px solid #e2e8f0;
    margin: 36px 0;
  }

  /* Page breaks */
  h1 { page-break-before: auto; }
  h2 { page-break-after: avoid; }
  pre, table { page-break-inside: avoid; }

  /* Footer watermark */
  @page {
    margin: 20mm 18mm;
    @bottom-center {
      content: counter(page) " / " counter(pages);
      font-size: 10px;
      color: #94a3b8;
    }
  }
</style>
</head>
<body>
${body}
</body>
</html>`;

writeFileSync("/tmp/documentation.html", html);
console.log("HTML hazırdır. PDF yaradılır...");

execSync(
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless=new \
    --disable-gpu \
    --no-sandbox \
    --print-to-pdf="/Users/ehtimad/Desktop/MarchGroupExam/exam-portal/QA_Exam_Portal_Documentation.pdf" \
    --print-to-pdf-no-header \
    --no-pdf-header-footer \
    /tmp/documentation.html`,
  { stdio: "inherit" }
);

console.log("PDF hazırdır: QA_Exam_Portal_Documentation.pdf");
