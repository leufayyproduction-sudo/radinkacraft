"use client";
export function DeleteConfirmForm({ action, id, message }: { action: (data: FormData) => Promise<void>; id: string; message: string }) {
  return <form action={action} onSubmit={(event) => { if (!window.confirm(message)) event.preventDefault(); }}><input type="hidden" name="id" value={id}/><button className="danger-button">Hapus</button></form>;
}
