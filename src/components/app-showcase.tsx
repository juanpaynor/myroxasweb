'use client';

import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';
import { MapPin, Calendar, MessageCircle, Bell, Search } from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'Report Issues',
    description: 'Report city concerns instantly',
    color: 'from-orange-500 to-red-500',
    side: 'left',
    delay: 0.2
  },
  {
    icon: Calendar,
    title: 'Book Appointments',
    description: 'Schedule with ease',
    color: 'from-blue-500 to-indigo-500',
    side: 'right',
    delay: 0.4
  },
  {
    icon: MessageCircle,
    title: 'Live Support',
    description: 'Real-time assistance',
    color: 'from-green-500 to-teal-500',
    side: 'left',
    delay: 0.6
  },
  {
    icon: Bell,
    title: 'City Updates',
    description: 'Stay informed always',
    color: 'from-purple-500 to-pink-500',
    side: 'right',
    delay: 0.8
  },
  {
    icon: Search,
    title: 'Service Discovery',
    description: 'Find what you need fast',
    color: 'from-yellow-500 to-orange-500',
    side: 'left',
    delay: 1.0
  }
];

export function AppShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="relative w-full py-20 md:py-32 bg-gradient-to-br from-white via-yellow-50 to-orange-50 overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute top-1/4 left-10 w-64 h-64 bg-yellow-300/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
              Experience Roxas City
            </span>
            <br />
            <span className="text-gray-900">In Your Hands</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            A beautiful, intuitive interface designed for every citizen
          </p>
        </motion.div>

        {/* Phone in Center with Features on Sides */}
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
            
            {/* Left Features */}
            <div className="space-y-6 order-2 lg:order-1">
              {features.filter(f => f.side === 'left').map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: -200, x: -50, rotate: -20 }}
                  animate={isInView ? { 
                    opacity: 1, 
                    y: 0, 
                    x: 0, 
                    rotate: 0 
                  } : {}}
                  transition={{
                    duration: 0.8,
                    delay: feature.delay,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{ scale: 1.05, x: 10 }}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
                    {/* Animated Gradient Background */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                    />
                    
                    <div className="relative flex items-center gap-4">
                      <motion.div
                        className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-600 group-hover:to-orange-600 transition-all">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Center - Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative flex justify-center order-1 lg:order-2"
            >
              <motion.div
                animate={{
                  y: [-15, 15, -15],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                {/* Glow Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-yellow-400/40 to-orange-400/40 rounded-[3rem] blur-3xl"
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.4, 0.6, 0.4]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Phone Frame */}
                <div className="relative w-[280px] md:w-[320px] aspect-[9/19] bg-gradient-to-br from-gray-900 to-black rounded-[3rem] shadow-2xl p-3">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-20" />
                  
                  <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                    <Image
                      src="/assets/images/app-screen.png"
                      alt="MyRoxas App Screenshot"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Features */}
            <div className="space-y-6 order-3">
              {features.filter(f => f.side === 'right').map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: -200, x: 50, rotate: 20 }}
                  animate={isInView ? { 
                    opacity: 1, 
                    y: 0, 
                    x: 0, 
                    rotate: 0 
                  } : {}}
                  transition={{
                    duration: 0.8,
                    delay: feature.delay,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{ scale: 1.05, x: -10 }}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
                    {/* Animated Gradient Background */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                    />
                    
                    <div className="relative flex items-center gap-4">
                      <motion.div
                        className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}
                        whileHover={{ rotate: -360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-600 group-hover:to-orange-600 transition-all">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
