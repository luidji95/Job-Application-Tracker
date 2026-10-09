type LogoProps = {
  size?: number;
  // "dark" is for light backgrounds, "light" for the navy sidebar
  tone?: "dark" | "light";
};

export function Logo({ size = 28, tone = "dark" }: LogoProps) {
  const first = tone === "dark" ? "#12172b" : "#ffffff";
  const second = tone === "dark" ? "#3445e0" : "#8c97ff";
  const third = tone === "dark" ? "#0b7a5a" : "#4fd3a3";

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="1" y="3" width="7" height="22" rx="2" fill={first} />
      <rect x="10.5" y="3" width="7" height="14" rx="2" fill={second} />
      <rect x="20" y="3" width="7" height="8" rx="2" fill={third} />
    </svg>
  );
}
