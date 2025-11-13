import { Header } from '@/components/layout/header';
import { Hero } from '@/components/hero';
import { Features } from '@/components/features';
import { EmergencyHotlines } from '@/components/emergency-hotlines';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col animated-gradient">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
      <EmergencyHotlines />
    </div>
  );
}
