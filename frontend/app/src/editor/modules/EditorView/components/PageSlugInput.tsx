interface PageSlugInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PageSlugInput({ value, onChange }: PageSlugInputProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="select-none font-mono text-xs text-muted-foreground">/</span>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder="page-slug"
        className="w-48 bg-transparent font-mono text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/30"
      />
    </div>
  );
}
