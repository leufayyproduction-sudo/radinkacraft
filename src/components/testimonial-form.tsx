"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitTestimonial, type TestimonialFormState } from "@/app/ulasan/actions";

const initialState: TestimonialFormState = {};
function SubmitButton(){const {pending}=useFormStatus();return <button className="buy-button" type="submit" disabled={pending}>{pending?"Mengirim…":"Kirim ulasan"}</button>}
export function TestimonialForm({ initialName = "" }: { initialName?: string }) {
  const [state, action] = useFormState(submitTestimonial, initialState);
  const [rating, setRating] = useState(5);
  const [startedAt, setStartedAt] = useState(0);
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState("");
  useEffect(() => setStartedAt(Date.now()), []);
  useEffect(() => {
    if (!state.resetKey) return;
    setName(""); setMessage(""); setRating(5); setStartedAt(Date.now());
  }, [state.resetKey]);
  function onRatingKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") { event.preventDefault(); setRating((current) => Math.min(5, current + 1)); }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") { event.preventDefault(); setRating((current) => Math.max(1, current - 1)); }
  }
  return <form action={action} className="testimonial-form">
    <label>Namamu<input name="name" required minLength={2} maxLength={60} value={name} onChange={(event)=>setName(event.target.value)} /></label>
    <fieldset><legend>Penilaian</legend><input type="hidden" name="rating" value={rating} /><div className="testimonial-rating" role="radiogroup" aria-label="Pilih nilai bintang" onKeyDown={onRatingKeyDown}>{[1,2,3,4,5].map((value)=><button key={value} type="button" role="radio" aria-checked={rating===value} aria-label={`${value} dari 5 bintang`} tabIndex={rating===value?0:-1} className={value<=rating?"is-active":""} onClick={()=>setRating(value)}>★</button>)}</div></fieldset>
    <label>Ceritakan pengalamanmu<textarea name="message" required minLength={10} maxLength={300} rows={4} placeholder="Tuliskan 10 sampai 300 karakter" value={message} onChange={(event)=>setMessage(event.target.value)}/><small>{message.length}/300 karakter</small></label>
    <label className="testimonial-honeypot" aria-hidden="true" tabIndex={-1}>Jangan isi kolom ini<input name="website" autoComplete="off" tabIndex={-1} /></label>
    <input type="hidden" name="startedAt" value={startedAt} />
    {state.message&&<p className="testimonial-feedback" role="status">{state.message}</p>}
    <SubmitButton />
  </form>;
}
