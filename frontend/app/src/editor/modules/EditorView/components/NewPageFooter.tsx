import { Button } from "@markdown-editor/ui";

interface NewPageFooterProps {
  onDiscard: () => void;
  onCreate: () => void;
  isCreating?: boolean;
}

export function NewPageFooter({ onDiscard, onCreate, isCreating = false }: NewPageFooterProps) {
  return (
    <div className="flex justify-end gap-2 border-t pt-4">
      <Button variant="outline" onClick={onDiscard} disabled={isCreating}>
        Discard
      </Button>
      <Button onClick={onCreate} disabled={isCreating}>
        {isCreating ? "Creating..." : "Create"}
      </Button>
    </div>
  );
}
