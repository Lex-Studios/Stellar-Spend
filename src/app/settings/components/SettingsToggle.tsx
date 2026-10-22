interface SettingsToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SettingsToggle({ label, checked, onChange }: SettingsToggleProps) {
  return (
    <label className="flex items-center justify-between p-4 bg-[#111] border border-[#222]">
      <span className="text-xs text-[#aaa] font-medium">{label}</span>
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="w-4 h-4 accent-[#c9a962]"
      />
    </label>
  );
}
