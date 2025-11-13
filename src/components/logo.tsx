import { Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnimatedLogo({ className }: { className?: string }) {
  return (
    <div className={cn("absolute", className)}>
        <Sun className="w-16 h-16 text-primary" />
    </div>
  );
}
