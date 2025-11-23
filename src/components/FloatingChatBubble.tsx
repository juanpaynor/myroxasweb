'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ConversationItem = {
  id: string;
  subject: string;
  priority: number;
  created_at: string;
  user_id: string;
};

export default function FloatingChatBubble() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });

  useEffect(() => {
    fetchWaitingConversations();
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchWaitingConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchWaitingConversations() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('support_conversations')
        .select('id, subject, priority, created_at, user_id')
        .eq('status', 'waiting_agent')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(5);

      if (!error && data) {
        setWaitingCount(data.length);
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;

      function handleMouseMove(e: MouseEvent) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - startX)),
          y: Math.max(0, Math.min(window.innerHeight - 400, e.clientY - startY)),
        });
      }

      function handleMouseUp() {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }

  function formatWaitTime(createdAt: string) {
    const wait = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (wait < 1) return 'Just now';
    if (wait < 60) return `${wait}m ago`;
    const hours = Math.floor(wait / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <>
      {/* Floating Bubble Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center text-white z-50 group"
          >
            <MessageSquare className="w-7 h-7" />
            {waitingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                {waitingCount}
              </span>
            )}
            <span className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Waiting Chats
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: `${position.y}px`,
              right: `${position.x}px`,
            }}
            onMouseDown={handleMouseDown}
            className={`w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden ${isDragging ? 'cursor-grabbing' : ''}`}
          >
            {/* Header */}
            <div className="drag-handle bg-gradient-to-r from-blue-500 to-indigo-600 p-4 cursor-grab active:cursor-grabbing">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <h3 className="font-semibold">Waiting Chats</h3>
                  {waitingCount > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {waitingCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 rounded p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto p-4 space-y-3">
              {waitingCount === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No waiting conversations</p>
                  <p className="text-xs mt-1">All caught up!</p>
                </div>
              ) : (
                <>
                  {conversations.map((conv, index) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/csm/support');
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                          {conv.subject}
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${
                          conv.priority >= 8
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : conv.priority >= 5
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}>
                          P{conv.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Waiting</span>
                        <span>{formatWaitTime(conv.created_at)}</span>
                      </div>
                    </motion.div>
                  ))}
                  
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/csm/support');
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    View All Conversations
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
