'use client';

import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'What is MyRoxas?',
    answer: 'MyRoxas is the official mobile app for Roxas City that connects citizens with city services, government offices, and community resources. It provides a convenient way to report issues, book appointments, and stay informed about city updates.'
  },
  {
    question: 'Is MyRoxas free to use?',
    answer: 'Yes! MyRoxas is completely free to download and use for all citizens of Roxas City. There are no hidden fees or subscription costs.'
  },
  {
    question: 'What devices are supported?',
    answer: 'MyRoxas is available for both iOS devices (iPhone and iPad running iOS 12.0 or later) and Android devices (running Android 6.0 or later). You can download it from the App Store or Google Play Store.'
  },
  {
    question: 'How do I report an issue in my area?',
    answer: 'Simply open the MyRoxas app, tap on "Report Issue," take a photo of the problem, add a description, and your location will be automatically detected. City officials will receive your report and work on resolving it.'
  },
  {
    question: 'Can I book appointments with city offices?',
    answer: 'Yes! You can schedule appointments with various city departments directly through the app. Choose the service you need, select an available time slot, and receive confirmation instantly.'
  },
  {
    question: 'How do I receive city updates and announcements?',
    answer: 'Once you download the app and enable notifications, you\'ll automatically receive important city announcements, event notifications, and emergency alerts directly on your device.'
  },
  {
    question: 'Is my personal information secure?',
    answer: 'Absolutely. We take your privacy seriously. All data is encrypted and stored securely. We only collect information necessary to provide you with city services and never share your personal details with third parties.'
  },
  {
    question: 'What should I do if I need immediate emergency assistance?',
    answer: 'For emergencies, always call the emergency hotlines directly: Police (168), Fire Department (160), or Ambulance (911). The MyRoxas app is for non-emergency city services and reporting.'
  },
  {
    question: 'Can I use MyRoxas if I\'m not a resident of Roxas City?',
    answer: 'The app is primarily designed for Roxas City residents, but visitors and tourists can also use it to access information about city services, events, and emergency contacts during their stay.'
  },
  {
    question: 'How do I contact support if I need help?',
    answer: 'You can reach our support team through the in-app chat feature, email us at support@myroxas.com, or visit the City Hall Information Desk during office hours.'
  }
];

export function FAQ() {
  return (
    <section className="relative w-full py-20 md:py-32 bg-gradient-to-br from-blue-50 via-white to-yellow-50 overflow-hidden">
      {/* Animated Background */}
      <motion.div
        className="absolute top-20 left-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 80, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-80 h-80 bg-yellow-200/30 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -60, 0],
          scale: [1, 1.3, 1]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-6 shadow-lg"
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <HelpCircle className="w-8 h-8 text-white" />
          </motion.div>
          
          <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Frequently Asked
            </span>
            <br />
            <span className="text-gray-900">Questions</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about MyRoxas
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <AccordionItem 
                  value={`item-${index}`} 
                  className="bg-white rounded-2xl border border-gray-200 px-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:text-blue-600 py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="text-gray-600 text-lg mb-4">
            Still have questions?
          </p>
          <motion.a
            href="mailto:support@myroxas.com"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Contact our support team
            <span className="text-2xl">→</span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
