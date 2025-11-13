'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AnimatedLogo } from './logo';
import { ArrowDown } from 'lucide-react';
import { Button } from './ui/button';

export function Hero() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-background');

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative z-10 flex flex-col items-center text-center text-white p-4">
        <div className="relative mb-8 h-48 w-48 flex items-center justify-center">
            <AnimatedLogo className="animate-orbit" />
        </div>

        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter animate-fade-in" style={{animationDelay: '0.2s'}}>
          MyRoxas
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-primary-foreground/80 animate-fade-in" style={{animationDelay: '0.4s'}}>
          Your direct line to Roxas City. Report issues, book appointments, and stay connected.
        </p>
      </div>

      <Button 
        variant="ghost" 
        size="icon"
        className="absolute bottom-10 z-10 text-white animate-bounce"
        onClick={scrollToFeatures}
        aria-label="Scroll to features"
      >
        <ArrowDown className="h-8 w-8" />
      </Button>
    </section>
  );
}
