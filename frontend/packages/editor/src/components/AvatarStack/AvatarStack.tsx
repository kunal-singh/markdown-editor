import type { CollabUser } from "../../types/editor";

export interface AvatarStackProps {
  users: CollabUser[];
  maxVisible?: number;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
};

export function AvatarStack({ users, maxVisible = 4, size = "md", className }: AvatarStackProps) {
  const visible = users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  const sizeClass = SIZE_CLASSES[size] ?? "";

  return (
    <div className={["flex items-center -space-x-2", className].filter(Boolean).join(" ")}>
      {visible.map((user) => (
        <div
          key={user.id}
          title={user.name}
          className={`relative flex shrink-0 items-center justify-center rounded-full border-2 border-background font-medium text-white ${sizeClass}`}
          style={{ backgroundColor: user.color }}
          aria-label={user.name}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span>{user.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={`flex shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted font-medium text-muted-foreground ${sizeClass}`}
          aria-label={`${String(overflow)} more users`}
        >
          +{String(overflow)}
        </div>
      )}
    </div>
  );
}
