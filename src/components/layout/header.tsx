import { Sun } from "lucide-react";

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-transparent p-4">
      <nav className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold font-headline text-white">MyRoxas</span>
        </div>
      </nav>
    </header>
  );
}
