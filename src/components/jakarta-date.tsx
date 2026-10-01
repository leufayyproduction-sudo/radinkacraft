"use client";
import { useEffect, useState } from "react";

function todayParts() {
  const parts = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long" }).formatToParts(new Date());
  return { day: parts.find((part)=>part.type==="day")?.value??"1", month: parts.find((part)=>part.type==="month")?.value??"Oktober" };
}
export function JakartaDate() {
  const [date,setDate]=useState<{day:string;month:string}|null>(null);
  useEffect(()=>{const update=()=>setDate(todayParts());update();const timer=window.setInterval(update,60000);return()=>window.clearInterval(timer);},[]);
  return <h2 className="hero-date" aria-label={date?`${date.day} ${date.month}`:"Tanggal hari ini"} aria-hidden="false"><span>{date?.day??"00"}</span><span className="date-month">{date?.month??" "}</span></h2>;
}
