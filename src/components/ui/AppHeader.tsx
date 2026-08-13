import { Logo } from "@/components/ui/Logo";

interface AppHeaderProps {
  variant?: "light" | "dark";
  right?: React.ReactNode;
}

export function AppHeader({ variant = "dark", right }: AppHeaderProps) {
  return (
    <header
      className={`flex items-center justify-between px-4 py-4 sm:px-8 ${
        variant === "light" ? "border-b border-gray-100 bg-white/80 backdrop-blur-md" : ""
      }`}
    >
      <Logo variant={variant === "light" ? "light" : "dark"} />
      {right}
    </header>
  );
}
