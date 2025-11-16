'use client';

import { motion, useInView } from 'framer-motion';
import { MessageCircle, Calendar, MapPin, Bell, Search } from 'lucide-react';
import { useRef } from 'react';

const features = [
  {
    icon: MapPin,
    title: 'Report Issues',
    description: 'Report potholes, broken streetlights, and other city concerns with photos and location.',
    color: 'from-orange-500 to-red-500',
    delay: 0.1
  },
  {
    icon: Calendar,
    title: 'Book Appointments',
    description: 'Schedule appointments with city offices, departments, and services easily.',
    color: 'from-blue-500 to-indigo-500',
    delay: 0.2
  },
  {
    icon: MessageCircle,
    title: 'Live Support',
    description: 'Chat with city representatives in real-time for quick assistance and answers.',
    color: 'from-green-500 to-teal-500',
    delay: 0.3
  },
  {
    icon: Bell,
    title: 'City Updates',
    description: 'Receive notifications about city events, announcements, and important updates.',
    color: 'from-purple-500 to-pink-500',
    delay: 0.4
  },
  {
    icon: Search,
    title: 'Service Discovery',
    description: 'Find the right city service or department for your specific needs instantly.',
    color: 'from-yellow-500 to-orange-500',
    delay: 0.5
  }
];

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="features" className="relative w-full py-20 md:py-32 bg-gradient-to-br from-gray-50 via-white to-yellow-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 -left-20 w-72 h-72 bg-yellow-300/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 -right-20 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
              Powerful Features
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to stay connected with Roxas City services
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100, scale: 0.8 }}
              animate={isInView ? { 
                opacity: 1, 
                x: 0, 
                scale: 1 
              } : { 
                opacity: 0, 
                x: index % 2 === 0 ? -100 : 100, 
                scale: 0.8 
              }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.15,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              <div className="relative h-full bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
                {/* Animated Gradient Background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Content - Horizontal Layout */}
                <div className="relative flex items-start gap-6">
                  {/* Icon */}
                  <motion.div
                    className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Text Content */}
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-600 group-hover:to-orange-600 transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Decorative Corner Element */}
                <motion.div
                  className="absolute top-0 right-0 w-24 h-24 opacity-10"
                  animate={{
                    rotate: [0, 90, 180, 270, 360],
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <feature.icon className="w-full h-full text-gray-400" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-gray-600 text-lg mb-6">
            Download MyRoxas today and experience civic services like never before
          </p>
          <motion.div
            className="inline-flex gap-4"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-full font-bold shadow-lg">
              Available on iOS & Android
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
