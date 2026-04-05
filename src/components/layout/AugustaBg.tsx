"use client";

import { useEffect, useState } from "react";

const SLIDE_COUNT = 4;
const INTERVAL_MS = 6000;

export default function AugustaBg() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDE_COUNT);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="augusta-bg">
      {Array.from({ length: SLIDE_COUNT }, (_, i) => (
        <div
          key={i}
          className={`augusta-slide slide-${i + 1} ${active === i ? "active" : ""}`}
        />
      ))}
    </div>
  );
}
