import Image from 'next/image';

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-transparent p-4">
      <nav className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image 
            src="/assets/images/logo.ico" 
            alt="MyRoxas Logo" 
            width={32} 
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-bold font-headline text-white">MyRoxas</span>
        </div>
      </nav>
    </header>
  );
}
