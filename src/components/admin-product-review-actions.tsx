"use client";
import { useState, useTransition } from "react";
import type { ReviewStatus } from "@prisma/client";
import { deleteProductReview, saveSellerReply, setProductReviewStatus } from "@/app/admin/ulasan/actions";
import { ConfirmButton } from "@/components/admin-ui";
export function AdminProductReviewActions({id,status,reply}:{id:string;status:ReviewStatus;reply:string|null}){
 const [text,setText]=useState(reply??"");const [message,setMessage]=useState("");const [pending,start]=useTransition();
 return <div className="admin-review-actions">
   {status!=="PUBLISHED"&&<button className="secondary-button" disabled={pending} onClick={()=>start(async()=>{const result=await setProductReviewStatus(id,"PUBLISHED");setMessage(result.error??"Ulasan diterbitkan.");})}>Setujui / tampilkan</button>}
   {status!=="HIDDEN"&&<button className="secondary-button" disabled={pending} onClick={()=>start(async()=>{const result=await setProductReviewStatus(id,"HIDDEN");setMessage(result.error??"Ulasan disembunyikan.");})}>Sembunyikan</button>}
   <form onSubmit={(event)=>{event.preventDefault();start(async()=>{const result=await saveSellerReply(id,text);setMessage(result.error??(text.trim()?"Balasan tersimpan.":"Balasan dihapus."));});}}><label>Balasan penjual<textarea maxLength={1000} value={text} onChange={(event)=>setText(event.target.value)}/></label><button className="secondary-button" disabled={pending}>{text.trim()?"Simpan balasan":"Hapus balasan"}</button></form>
   <ConfirmButton message="Hapus ulasan dan seluruh fotonya secara permanen?" action={async()=>{const result=await deleteProductReview(id);setMessage(result.error??"Ulasan dihapus.");if(!result.error)window.location.reload();}}>Hapus permanen</ConfirmButton>
   {message&&<p role="status">{message}</p>}
 </div>;
}
