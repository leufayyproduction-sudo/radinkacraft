"use client";
import { useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { qrisUploadUrl, prepareOrderQris } from "@/app/admin/payments-actions";
import { formatRupiah } from "@/lib/money";
export function AdminOrderQris({ orderId, amount }: { orderId: string; amount: number }) {
 const [path,setPath]=useState(""); const [preview,setPreview]=useState(""); const [label,setLabel]=useState(""); const [save,setSave]=useState(true); const [message,setMessage]=useState("");
 async function upload(file?:File){if(!file)return;try{const image=await imageCompression(file,{maxSizeMB:4.8,maxWidthOrHeight:1600,useWebWorker:true,fileType:"image/webp"});const signed=await qrisUploadUrl();const {error}=await createClient().storage.from("qris").uploadToSignedUrl(signed.path,signed.token,image,{contentType:"image/webp"});if(error)throw error;setPath(signed.path);setPreview(URL.createObjectURL(image));}catch{setMessage("Gambar QRIS gagal diunggah.");}}
 return <section className="admin-card admin-form"><h2>Siapkan QRIS untuk {formatRupiah(amount)}</h2><label>Gambar QRIS<input type="file" accept="image/*" onChange={(e)=>void upload(e.target.files?.[0])}/></label>{preview&&<Image src={preview} alt="Pratinjau QRIS" width={180} height={180} unoptimized style={{objectFit:"contain"}}/>}<label>Label opsional<input value={label} onChange={(e)=>setLabel(e.target.value)}/></label><label className="admin-check"><input type="checkbox" checked={save} onChange={(e)=>setSave(e.target.checked)}/> Simpan ke pustaka</label><button className="buy-button" disabled={!path} onClick={async()=>{const result=await prepareOrderQris(orderId,path,label,save);setMessage(result.error??"QRIS siap untuk pelanggan.");if(!result.error)window.location.reload();}}>Simpan dan kirim QRIS</button>{message&&<p role="status">{message}</p>}</section>;
}
