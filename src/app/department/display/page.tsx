'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type DisplayAppointment = {
  id: string;
  ticket_number: string;
  status: string;
  serving_started_at: string;
};

export default function DepartmentDisplayPage() {
  const [servingNow, setServingNow] = useState<DisplayAppointment[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadServingAppointments();

    // Realtime subscription
    const subscription = supabase.then(client => 
      client
        .channel('display_appointments')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'appointments' },
          () => loadServingAppointments()
        )
        .subscribe()
    );

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      subscription.then(sub => sub.unsubscribe());
      clearInterval(timeInterval);
    };
  }, []);

  async function loadServingAppointments() {
    try {
      const client = await supabase;
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await client
        .from('appointments')
        .select('id, ticket_number, status, serving_started_at')
        .eq('appointment_date', today)
        .eq('status', 'serving')
        .order('serving_started_at', { ascending: true });

      if (error) {
        console.error('Error loading serving appointments:', error);
        return;
      }

      setServingNow(data || []);
    } catch (error) {
      console.error('Error loading serving appointments:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-500 to-blue-500 text-white p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold mb-4 text-white drop-shadow-2xl"
        >
          NOW SERVING
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-semibold text-white/90"
        >
          {currentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </motion.div>
      </div>

      {/* Ticket Display */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="popLayout">
          {servingNow.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/20 backdrop-blur-lg rounded-3xl p-16 text-center"
            >
              <p className="text-4xl font-semibold text-white/80">
                Please wait...
              </p>
            </motion.div>
          ) : servingNow.length === 1 ? (
            <motion.div
              key={servingNow[0].id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-3xl shadow-2xl p-24 text-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700"
              >
                {servingNow[0].ticket_number}
              </motion.div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              {servingNow.slice(0, 4).map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-xl p-12 text-center"
                >
                  <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">
                    {appointment.ticket_number}
                  </div>
                  <div className="mt-4 text-lg text-gray-600 font-semibold">
                    Counter {index + 1}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-16 text-white/80 text-2xl font-medium"
      >
        Please proceed to the counter • Thank you for your patience
      </motion.div>
    </div>
  );
}
