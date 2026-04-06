interface PageTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PageTitleInput({ value, onChange, placeholder = "Untitled" }: PageTitleInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground/40"
    />
  );
}
