"use client";
import { useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { qrisUploadUrl, saveQrisAsset } from "@/app/admin/payments-actions";
type Initial={id:string;amount:number;imagePath:string;label:string|null;isActive:boolean};
export function AdminQrisForm({ amount, initial, storageUrl }: { amount?: number; initial?: Initial; storageUrl?: string }) {
 const [path,setPath]=useState(initial?.imagePath??""); const [preview,setPreview]=useState(initial&&storageUrl?`${storageUrl}/storage/v1/object/public/qris/${initial.imagePath}`:""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 async function upload(file?:File){if(!file)return;setBusy(true);setError("");try{const compressed=await imageCompression(file,{maxSizeMB:4.8,maxWidthOrHeight:1600,useWebWorker:true,fileType:"image/webp"});const signed=await qrisUploadUrl();const {error:uploadError}=await createClient().storage.from("qris").uploadToSignedUrl(signed.path,signed.token,compressed,{contentType:"image/webp"});if(uploadError)throw new Error("Gambar gagal diunggah.");setPath(signed.path);setPreview(URL.createObjectURL(compressed));}catch(e){setError(e instanceof Error?e.message:"Gambar belum dapat diunggah.");}finally{setBusy(false)}}
 return <form action={saveQrisAsset} className="admin-card admin-form"><h2>{initial?"Ubah QRIS":"Tambah QRIS"}</h2>{initial&&<input type="hidden" name="id" value={initial.id}/>}<label>Nominal (Rp)<input type="number" name="amount" min="1" required defaultValue={initial?.amount??amount}/></label><label>Label<input name="label" maxLength={120} defaultValue={initial?.label??""} placeholder="QRIS Dana"/></label><label>Gambar QRIS<input type="file" accept="image/*" required={!path} onChange={(e)=>void upload(e.target.files?.[0])}/></label>{busy&&<p>Mengunggah gambar…</p>}{error&&<p className="admin-error">{error}</p>}{preview&&<Image src={preview} alt="Pratinjau QRIS" width={180} height={180} unoptimized style={{objectFit:"contain"}}/>}<input type="hidden" name="imagePath" value={path}/><label className="admin-check"><input type="checkbox" name="isActive" defaultChecked={initial?.isActive??true}/> Aktif</label><button className="buy-button" disabled={busy||!path}>Simpan QRIS</button></form>;
}
