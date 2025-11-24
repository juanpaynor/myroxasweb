import Image from 'next/image';
import { cn } from '@/lib/utils';

export function AnimatedLogo({ className }: { className?: string }) {
  return (
    <div className={cn("absolute", className)}>
        <Image 
          src="/assets/images/logo.ico" 
          alt="MyRoxas Logo" 
          width={64} 
          height={64}
          className="w-16 h-16"
        />
    </div>
  );
}
