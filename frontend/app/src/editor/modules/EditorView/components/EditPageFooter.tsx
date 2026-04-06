import { Button } from "@markdown-editor/ui";

interface EditPageFooterProps {
  onDelete: () => void;
  onSave: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export function EditPageFooter({
  onDelete,
  onSave,
  isSaving = false,
  isDeleting = false,
}: EditPageFooterProps) {
  return (
    <div className="flex justify-between border-t pt-4">
      <Button variant="outline" onClick={onDelete} disabled={isDeleting || isSaving}>
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
      <Button onClick={onSave} disabled={isSaving || isDeleting}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
