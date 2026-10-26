"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode, UIEvent } from "react";

type Props = { children: ReactNode };

/** แถบเลื่อนบนและล่างใช้ตำแหน่งเดียวกัน โดยไม่เปลี่ยนโครงสร้างตาราง */
export default function AssetHorizontalScroll({ children }: Props) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  const syncFromTop = useCallback((event: UIEvent<HTMLDivElement>) => {
    const bottom = bottomRef.current;
    if (bottom && bottom.scrollLeft !== event.currentTarget.scrollLeft) {
      bottom.scrollLeft = event.currentTarget.scrollLeft;
    }
  }, []);

  const syncFromBottom = useCallback((event: UIEvent<HTMLDivElement>) => {
    const top = topRef.current;
    if (top && top.scrollLeft !== event.currentTarget.scrollLeft) {
      top.scrollLeft = event.currentTarget.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const bottom = bottomRef.current;
    const table = bottom?.querySelector("table");
    if (!bottom || !table) return;

    const updateWidth = () => {
      setTableWidth(Math.max(table.scrollWidth, bottom.clientWidth));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(table);
    observer.observe(bottom);
    window.addEventListener("resize", updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  return (
    <div className="w-full min-w-0 max-w-full">
      <div
        ref={topRef}
        onScroll={syncFromTop}
        aria-label="เลื่อนตารางแนวนอนด้านบน"
        role="region"
        tabIndex={0}
        className="mb-1 w-full max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain"
      >
        <div aria-hidden="true" style={{ width: tableWidth, height: 1 }} />
      </div>
      <div
        ref={bottomRef}
        onScroll={syncFromBottom}
        aria-label="ตารางครุภัณฑ์ เลื่อนซ้ายขวาได้"
        role="region"
        tabIndex={0}
        className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
      >
        {children}
      </div>
    </div>
  );
}
