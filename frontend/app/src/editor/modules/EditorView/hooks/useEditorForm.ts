import { useRef, useState } from "react";
import { slugify } from "@/editor/useCases/editorUseCases";

interface UseEditorFormOptions {
  initialTitle?: string;
  initialSlug?: string;
}

interface UseEditorFormResult {
  title: string;
  slug: string;
  setTitle: (value: string) => void;
  setSlug: (value: string) => void;
}

export function useEditorForm({
  initialTitle = "",
  initialSlug = "",
}: UseEditorFormOptions = {}): UseEditorFormResult {
  const [title, setTitleState] = useState(initialTitle);
  const [slug, setSlugState] = useState(initialSlug);
  // Tracks whether the user has manually edited the slug. Once true, title
  // changes no longer auto-update it.
  const slugManuallyEdited = useRef(initialSlug !== "");

  const setTitle = (value: string) => {
    setTitleState(value);
    if (!slugManuallyEdited.current) {
      setSlugState(slugify(value));
    }
  };

  const setSlug = (value: string) => {
    slugManuallyEdited.current = true;
    setSlugState(value);
  };

  return { title, slug, setTitle, setSlug };
}
