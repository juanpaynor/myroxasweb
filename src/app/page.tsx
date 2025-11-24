'use client';

import { Hero } from '@/components/hero';
import { AppShowcase } from '@/components/app-showcase';
import { Features } from '@/components/features';
import { FAQ } from '@/components/faq';
import { EmergencyHotlines } from '@/components/emergency-hotlines';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col animated-gradient">
      <main className="flex-1">
        <Hero />
        <AppShowcase />
        <Features />
        <FAQ />
      </main>
      <EmergencyHotlines />
      <Footer />
    </div>
  );
}
