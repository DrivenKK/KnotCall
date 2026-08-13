interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "light" | "dark";
}

const sizes = {
  sm: { icon: "h-7 w-7 text-xs", text: "text-sm" },
  md: { icon: "h-8 w-8 text-sm", text: "text-lg" },
  lg: { icon: "h-10 w-10 text-base", text: "text-xl" },
};

export function Logo({ size = "md", showText = true, variant = "dark" }: LogoProps) {
  const s = sizes[size];
  const isLight = variant === "light";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${s.icon} flex shrink-0 items-center justify-center font-semibold ${
          isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
        }`}
      >
        K
      </div>
      {showText && (
        <span
          className={`${s.text} font-medium tracking-tight ${
            isLight ? "text-zinc-900" : "text-white"
          }`}
        >
          KnotCall
        </span>
      )}
    </div>
  );
}
