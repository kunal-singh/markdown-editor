import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b p-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`rounded px-2 py-1 text-sm${editor.isActive("bold") ? " bg-muted font-bold" : ""}`}
        type="button"
        aria-label="Bold"
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`rounded px-2 py-1 text-sm italic${editor.isActive("italic") ? " bg-muted" : ""}`}
        type="button"
        aria-label="Italic"
      >
        I
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`rounded px-2 py-1 text-sm line-through${editor.isActive("strike") ? " bg-muted" : ""}`}
        type="button"
        aria-label="Strike"
      >
        S
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`rounded px-2 py-1 text-sm font-bold${editor.isActive("heading", { level: 1 }) ? " bg-muted" : ""}`}
        type="button"
        aria-label="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`rounded px-2 py-1 text-sm font-bold${editor.isActive("heading", { level: 2 }) ? " bg-muted" : ""}`}
        type="button"
        aria-label="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded px-2 py-1 text-sm${editor.isActive("bulletList") ? " bg-muted" : ""}`}
        type="button"
        aria-label="Bullet list"
      >
        • List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`rounded px-2 py-1 font-mono text-sm${editor.isActive("codeBlock") ? " bg-muted" : ""}`}
        type="button"
        aria-label="Code block"
      >
        {"</>"}
      </button>
      <button
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        className="rounded px-2 py-1 text-sm"
        type="button"
        aria-label="Insert table"
      >
        Table
      </button>
    </div>
  );
}
