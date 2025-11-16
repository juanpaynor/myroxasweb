'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { Button } from './ui/button';

export function Hero() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Content */}
      <div className="relative h-screen w-full flex flex-col lg:flex-row items-center justify-start px-4 sm:px-8 lg:px-0 py-12 lg:py-0 gap-0">
        {/* Text/Logo Section */}
        <motion.div
          className="w-full lg:w-auto lg:absolute lg:top-24 lg:left-20 xl:left-24 flex items-start justify-center lg:justify-start mb-8 lg:mb-0 z-10"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="relative w-full max-w-lg lg:max-w-3xl xl:max-w-4xl">
            <Image
              src="/assets/images/myroxas_text.png"
              alt="MyRoxas - ATON ini!"
              width={1200}
              height={600}
              priority
              className="w-full h-auto"
            />
          </div>
        </motion.div>

        {/* Model Image Section */}
        <motion.div
          className="w-full relative h-[400px] lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:left-[35%] lg:h-auto flex items-end justify-end z-10 overflow-hidden"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <Image
            src="/assets/images/model.png"
            alt="Happy user with MyRoxas app"
            fill
            priority
            className="object-cover object-center lg:object-left-bottom"
          />
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <Button 
          variant="ghost" 
          size="icon"
          className="text-gray-700 hover:text-gray-900 animate-bounce bg-white/80 hover:bg-white/90 rounded-full shadow-lg backdrop-blur-sm border border-white/30"
          onClick={scrollToFeatures}
          aria-label="Scroll to features"
        >
          <ArrowDown className="h-6 w-6" />
        </Button>
      </motion.div>
    </section>
  );
}
