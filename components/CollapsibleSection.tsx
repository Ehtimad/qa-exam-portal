"use client";

import { useState } from "react";

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-left">
          {title}
        </h2>
        <span className="text-gray-400 group-hover:text-blue-600 text-sm ml-4 flex-shrink-0">
          {open ? "▲ Gizlət" : "▼ Göstər"}
        </span>
      </button>
      {open && <div>{children}</div>}
    </section>
  );
}
