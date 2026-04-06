import { Button } from "@markdown-editor/ui";

interface EditPageFooterProps {
  onDelete: () => void;
  onSave: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  disabled?: boolean;
  createdByName?: string | null;
  lastEditedByName?: string | null;
  lastEditedAt?: string | null;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function EditPageFooter({
  onDelete,
  onSave,
  isSaving = false,
  isDeleting = false,
  disabled = false,
  createdByName,
  lastEditedByName,
  lastEditedAt,
}: EditPageFooterProps) {
  return (
    <div className="flex items-center justify-between border-t pt-4">
      <div className="flex gap-4 text-xs text-muted-foreground">
        {createdByName && (
          <span>
            Created by <span className="font-medium text-foreground">{createdByName}</span>
          </span>
        )}
        {lastEditedByName && lastEditedAt && (
          <span>
            Last edited by <span className="font-medium text-foreground">{lastEditedByName}</span>
            {" · "}
            {formatDate(lastEditedAt)}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onDelete} disabled={isDeleting || isSaving}>
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
        <Button onClick={onSave} disabled={isSaving || isDeleting || disabled}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
