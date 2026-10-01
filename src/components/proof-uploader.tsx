"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { confirmProofUploaded, createProofUploadUrl } from "@/app/checkout/actions";

const MAX_SIZE = 5 * 1024 * 1024;

export function ProofUploader({ orderNumber, token, onUploaded, compact = false }: { orderNumber: string; token?: string; onUploaded?: () => void; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function selectFile(candidate?: File) {
    if (!candidate) return;
    setError("");
    let next = candidate;
    if (candidate.type.startsWith("image/")) {
      try { next = await imageCompression(candidate, { maxSizeMB: 4.8, maxWidthOrHeight: 2400, useWebWorker: true, fileType: "image/webp" }); } catch { /* Kirim file aslinya jika kompresi tidak didukung. */ }
    }
    if (next.size > MAX_SIZE || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(next.type)) { setError("Pilih JPG, PNG, WebP, atau PDF maksimal 5 MB."); return; }
    setFile(next);
    setPreview(next.type.startsWith("image/") ? URL.createObjectURL(next) : "");
  }

  async function upload() {
    if (!file) { inputRef.current?.click(); return; }
    setBusy(true); setError("");
    try {
      const upload = await createProofUploadUrl(orderNumber, token, { name: file.name.replace(/\.[^.]+$/, file.type === "image/webp" ? ".webp" : `.${file.name.split(".").pop()}`), type: file.type, size: file.size });
      const { error: uploadError } = await createClient().storage.from("payment-proofs").uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error("Bukti belum berhasil diunggah. Coba kembali.");
      await confirmProofUploaded(orderNumber, token, upload.path);
      setFile(null); setPreview(""); onUploaded?.();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Bukti belum dapat diunggah."); }
    finally { setBusy(false); }
  }

  return <div className={`proof-uploader${compact ? " proof-compact" : ""}`}>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" hidden onChange={(event) => void selectFile(event.target.files?.[0])} />
    <div className="proof-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void selectFile(event.dataTransfer.files[0]); }}>
      {preview ? <Image src={preview} alt="Pratinjau bukti pembayaran" width={240} height={180} unoptimized /> : <span aria-hidden="true">↥</span>}
      <p>{file ? file.name : "Letakkan bukti pembayaran di sini atau pilih file"}</p><small>JPG, PNG, WebP, atau PDF · maksimal 5 MB</small>
      <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>{file ? "Ganti bukti" : "Pilih bukti"}</button>
    </div>
    {error && <p className="form-message form-error" role="alert">{error}</p>}
    {file && <button className="buy-button" type="button" disabled={busy} onClick={() => void upload()}>{busy ? "Mengunggah…" : "Kirim bukti pembayaran"}</button>}
  </div>;
}
