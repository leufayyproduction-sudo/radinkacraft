"use client";
import { useState } from "react";
import { MediaPicker, ConfirmButton, type MediaOption } from "@/components/admin-ui";
import { saveBankAccount, deleteBankAccount, moveBankAccount } from "@/app/admin/payments-actions";

type Bank = { id: string; bankName: string; accountNumber: string; accountHolder: string; logoUrl: string | null; sortOrder: number; isActive: boolean };
export function AdminBankForm({ rows, media }: { rows: Bank[]; media: MediaOption[] }) {
  const [newLogo, setNewLogo] = useState("");
  const [logos, setLogos] = useState<Record<string, string>>(Object.fromEntries(rows.map((row) => [row.id, row.logoUrl ?? ""])));
  return <div className="admin-card admin-form">
    <h2>Tambah rekening</h2>
    <form action={saveBankAccount} className="admin-form-grid">
      <label>Nama bank<input required name="bankName" /></label><label>Nomor rekening<input required name="accountNumber" /></label><label>Atas nama<input required name="accountHolder" /></label><label>Urutan<input type="number" min="0" name="sortOrder" defaultValue="0" /></label>
      <div className="field-wide"><p>Logo rekening</p><MediaPicker items={media} selected={media.filter((item) => item.url === newLogo)} onSelect={(items) => setNewLogo(items[0]?.url ?? "")} /><input type="hidden" name="logoUrl" value={newLogo} /></div>
      <label className="admin-check"><input type="checkbox" name="isActive" defaultChecked /> Aktif</label><button className="buy-button">Simpan rekening</button>
    </form>
    <h2>Rekening terdaftar</h2>
    {rows.map((row, index) => <form action={saveBankAccount} className="admin-variant-row" key={row.id}>
      <input type="hidden" name="id" value={row.id} /><label>Nama bank<input name="bankName" defaultValue={row.bankName} /></label><label>Nomor rekening<input name="accountNumber" defaultValue={row.accountNumber} /></label><label>Atas nama<input name="accountHolder" defaultValue={row.accountHolder} /></label><label>Urutan<input type="number" name="sortOrder" defaultValue={row.sortOrder} /></label>
      <label className="admin-check"><input type="checkbox" name="isActive" defaultChecked={row.isActive} /> Aktif</label><div><MediaPicker items={media} selected={media.filter((item) => item.url === (logos[row.id] ?? ""))} onSelect={(items) => setLogos((state) => ({ ...state, [row.id]: items[0]?.url ?? "" }))} /></div><input type="hidden" name="logoUrl" value={logos[row.id] ?? ""} /><button className="secondary-button">Simpan</button>
      <button type="button" className="icon-button" disabled={!index} aria-label="Naikkan urutan" onClick={async () => { await moveBankAccount(row.id, -1); window.location.reload(); }}>↑</button><button type="button" className="icon-button" disabled={index === rows.length - 1} aria-label="Turunkan urutan" onClick={async () => { await moveBankAccount(row.id, 1); window.location.reload(); }}>↓</button>
      <ConfirmButton message="Hapus rekening ini? Jika pernah dipakai, nonaktifkan sebagai gantinya." action={async () => { const result = await deleteBankAccount(row.id); if (result.error) { window.alert(result.error); if (window.confirm("Nonaktifkan rekening ini sekarang?")) { const data = new FormData(); data.set("id", row.id); data.set("bankName", row.bankName); data.set("accountNumber", row.accountNumber); data.set("accountHolder", row.accountHolder); data.set("sortOrder", String(row.sortOrder)); data.set("logoUrl", logos[row.id] ?? ""); await saveBankAccount(data); window.location.reload(); } } else window.location.reload(); }}>Hapus</ConfirmButton>
    </form>)}
  </div>;
}
