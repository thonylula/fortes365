export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      className="animate-[spin_0.6s_linear_infinite]"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="50 20"
      />
    </svg>
  );
}
