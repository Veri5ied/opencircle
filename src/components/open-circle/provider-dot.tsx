type ProviderDotProps = {
  color: string;
  active: boolean;
};

export function ProviderDot({ color, active }: ProviderDotProps) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full transition-all duration-200"
      style={{
        background: active ? color : "#1a1730",
        boxShadow: active ? `0 0 0 2px ${color}28` : "none",
      }}
    />
  );
}
