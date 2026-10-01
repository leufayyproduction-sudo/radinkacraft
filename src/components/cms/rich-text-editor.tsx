"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

export default function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({ extensions: [StarterKit, Link.configure({ openOnClick: false }), Image], content: value, immediatelyRender: false, onUpdate: ({ editor: current }) => onChange(current.getHTML()) });
  return <div className="cms-editor"><div className="cms-editor-tools">{["bold", "italic", "bulletList", "orderedList"].map((command) => <button type="button" key={command} onClick={() => editor?.chain().focus()[command === "bold" ? "toggleBold" : command === "italic" ? "toggleItalic" : command === "bulletList" ? "toggleBulletList" : "toggleOrderedList"]().run()}>{command}</button>)}<button type="button" onClick={()=>{const href=window.prompt("Masukkan tautan HTTPS, relatif, email, atau telepon");if(href)editor?.chain().focus().setLink({href}).run();}}>Tautan</button><button type="button" onClick={()=>{const src=window.prompt("Masukkan URL HTTPS atau relatif gambar");if(src)editor?.chain().focus().setImage({src,alt:""}).run();}}>Gambar</button></div><EditorContent editor={editor} /></div>;
}
