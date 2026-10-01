"use client";

import { usePathname } from "next/navigation";

const petals = [
  { left: "4%", size: 15, duration: 13, delay: -9, sway: "-34px", rotation: "540deg" },
  { left: "12%", size: 21, duration: 17, delay: -3, sway: "42px", rotation: "720deg" },
  { left: "21%", size: 13, duration: 11, delay: -7, sway: "-28px", rotation: "480deg" },
  { left: "30%", size: 19, duration: 19, delay: -14, sway: "36px", rotation: "800deg" },
  { left: "39%", size: 14, duration: 15, delay: -5, sway: "-40px", rotation: "620deg" },
  { left: "48%", size: 22, duration: 18, delay: -12, sway: "31px", rotation: "760deg" },
  { left: "57%", size: 16, duration: 12, delay: -4, sway: "-36px", rotation: "500deg" },
  { left: "66%", size: 20, duration: 16, delay: -10, sway: "44px", rotation: "680deg" },
  { left: "75%", size: 13, duration: 14, delay: -6, sway: "-30px", rotation: "580deg" },
  { left: "84%", size: 18, duration: 20, delay: -16, sway: "38px", rotation: "840deg" },
  { left: "92%", size: 14, duration: 11, delay: -2, sway: "-42px", rotation: "520deg" },
  { left: "99%", size: 19, duration: 17, delay: -13, sway: "29px", rotation: "700deg" },
];

export function FallingPetals() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <div className="falling-petals" aria-hidden="true">{petals.map((petal, index) => <svg key={index} viewBox="0 0 100 70" style={{ left: petal.left, width: petal.size, animationDuration: `${petal.duration}s`, animationDelay: `${petal.delay}s`, "--petal-sway": petal.sway, "--petal-rotation": petal.rotation } as React.CSSProperties}><defs><linearGradient id={`falling-petal-${index}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fde6ea"/><stop offset="1" stopColor="#f39ab6"/></linearGradient></defs><path fill={`url(#falling-petal-${index})`} d="M4 30C10 6 60-6 96 14c-4 30-40 56-78 52C8 60 2 44 4 30z"/></svg>)}</div>;
}
