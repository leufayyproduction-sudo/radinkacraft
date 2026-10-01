"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { mediaUploadUrl, registerMedia } from "@/app/admin/actions";

export function ConfirmButton({ children, message, action, className = "danger-button" }: { children: React.ReactNode; message: string; action: () => void | Promise<void>; className?: string }) {
  return <button className={className} type="button" onClick={() => { if (window.confirm(message)) void action(); }}>{children}</button>;
}
export type MediaOption = { id: string; url: string; path: string; alt: string; width: number | null; height: number | null; sizeBytes: number; mimeType: string };

export function MediaPicker({ items, onSelect, multiple = false, selected = [] }: { items: MediaOption[]; onSelect: (items: MediaOption[]) => void; multiple?: boolean; selected?: MediaOption[] }) {
  const router=useRouter(); const [open, setOpen] = useState(false); const [search, setSearch] = useState(""); const [chosen, setChosen] = useState<MediaOption[]>(selected); const [uploaded, setUploaded] = useState<MediaOption[]>([]); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  function choose(item: MediaOption) { const next = multiple ? chosen.some((entry) => entry.id === item.id) ? chosen.filter((entry) => entry.id !== item.id) : [...chosen, item] : [item]; setChosen(next); if (!multiple) { onSelect(next); setOpen(false); } }
  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setError("");
    try {
      for (const original of Array.from(files)) {
        if (!original.type.startsWith("image/")) continue;
        const file = await imageCompression(original, { maxSizeMB: 4.8, maxWidthOrHeight: 1600, useWebWorker: true, fileType: "image/webp" });
        if (file.size > 5 * 1024 * 1024) throw new Error("Gambar harus maksimal 5 MB.");
        const bitmap = await createImageBitmap(file); const width = bitmap.width; const height = bitmap.height; bitmap.close();
        const signed = await mediaUploadUrl();
        const { error: uploadError } = await createClient().storage.from("media").uploadToSignedUrl(signed.path, signed.token, file, { contentType: "image/webp", upsert: false });
        if (uploadError) throw new Error("Gambar gagal diunggah ke Storage.");
        const media = await registerMedia({ path: signed.path, width, height, sizeBytes: file.size, mimeType: "image/webp", alt: "" });
        setUploaded((old) => [...old, media]); setChosen((old) => [...old, media]);
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Gambar belum dapat diunggah."); }
    finally { setBusy(false); router.refresh(); }
  }
  const available = [...uploaded, ...items].filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index);
  return <><button type="button" className="secondary-button" onClick={() => { setChosen(selected); setOpen(true); }}>Pilih gambar</button>{open && <div className="admin-modal-scrim" role="presentation"><section className="admin-modal floating-panel" role="dialog" aria-modal="true" aria-label="Pilih gambar"><div className="admin-modal-head"><h2>Pilih dari media</h2><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Tutup">×</button></div><div className="admin-toolbar"><input className="admin-input" placeholder="Cari alt text atau nama file" value={search} onChange={(event) => setSearch(event.target.value)} /><label className="secondary-button">Unggah gambar<input type="file" accept="image/*" multiple hidden onChange={(event) => void uploadFiles(event.target.files)} /></label></div>{busy && <p>Mengoptimalkan dan mengunggah gambar…</p>}{error && <p className="admin-error" role="alert">{error}</p>}<div className="media-upload-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void uploadFiles(event.dataTransfer.files); }}><p>Seret gambar ke sini untuk mengunggah · WebP maksimal 1600 px dan 5 MB</p><div className="media-grid">{available.filter((item) => item.alt.toLowerCase().includes(search.toLowerCase()) || item.path.toLowerCase().includes(search.toLowerCase())).map((item) => <button type="button" className={`media-tile${chosen.some((entry) => entry.id === item.id) ? " selected" : ""}`} key={item.id} onClick={() => choose(item)}><Image src={item.url} alt={item.alt || "Media tanpa teks alternatif"} width={180} height={140} /><span>{item.alt || "Teks alternatif kosong"}</span></button>)}</div></div><div className="admin-modal-actions"><button className="secondary-button" type="button" onClick={() => setOpen(false)}>Batal</button>{multiple && <button className="buy-button" type="button" onClick={() => { onSelect(chosen); setOpen(false); }}>Gunakan pilihan ({chosen.length})</button>}</div></section></div>}</>;
}
