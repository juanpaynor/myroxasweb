'use client';

import { motion } from 'framer-motion';
import { 
  MessageSquare,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Bell,
  Settings,
  LogOut,
  LayoutDashboard,
  FileText,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';

type QueueItem = {
  id: string;
  conversation_id: string;
  priority: number;
  waiting_since: string;
  estimated_wait_minutes: number;
  conversation: {
    id: string;
    user_id: string;
    subject: string;
    priority: number;
    ai_conversation_summary: string;
    created_at: string;
  };
  user: {
    id: string;
    full_name: string;
    email: string;
  };
};

export default function CSMSupportQueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [csmName, setCsmName] = useState('');

  useEffect(() => {
    checkAuth();
    fetchQueue();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  async function checkAuth() {
    const client = await supabase;
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      router.push('/login/csm');
      return;
    }

    const { data: profile } = await client
      .from('user_profiles')
      .select('full_name, role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'csm') {
      router.push('/');
      return;
    }

    setCsmName(profile.full_name || 'CSM');
  }

  async function fetchQueue() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('agent_queue')
        .select(`
          *,
          conversation:support_conversations!inner(
            id,
            user_id,
            subject,
            priority,
            ai_conversation_summary,
            created_at
          )
        `)
        .order('priority', { ascending: false })
        .order('waiting_since', { ascending: true });

      if (error) throw error;

      // Fetch user details for each conversation
      const queueWithUsers = await Promise.all(
        (data || []).map(async (item: any) => {
          const { data: userData } = await client
            .from('user_profiles')
            .select('id, full_name, email')
            .eq('id', item.conversation.user_id)
            .single();

          return {
            ...item,
            user: userData || { id: item.conversation.user_id, full_name: 'Unknown', email: '' },
          };
        })
      );

      setQueue(queueWithUsers);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  }

  async function acceptConversation(queueItem: QueueItem) {
    try {
      const client = await supabase;
      const { data: { session } } = await client.auth.getSession();
      if (!session) return;

      // Update conversation with assigned agent
      const { error: updateError } = await client
        .from('support_conversations')
        .update({
          status: 'with_agent',
          assigned_agent_id: session.user.id,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', queueItem.conversation_id);

      if (updateError) throw updateError;

      // Remove from queue
      const { error: deleteError } = await client
        .from('agent_queue')
        .delete()
        .eq('id', queueItem.id);

      if (deleteError) throw deleteError;

      // Navigate to chat interface
      router.push(`/csm/support/chat/${queueItem.conversation_id}`);
    } catch (error) {
      console.error('Error accepting conversation:', error);
      alert('Failed to accept conversation');
    }
  }

  function formatWaitTime(waitingSince: string) {
    const wait = Math.floor((Date.now() - new Date(waitingSince).getTime()) / 60000);
    if (wait < 1) return 'Just now';
    if (wait < 60) return `${wait}m`;
    return `${Math.floor(wait / 60)}h ${wait % 60}m`;
  }

  function getPriorityColor(priority: number) {
    if (priority >= 8) return 'text-red-600 dark:text-red-400';
    if (priority >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  }

  async function handleLogout() {
    const client = await supabase;
    await client.auth.signOut();
    router.push('/login/csm');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                Roxas City
              </h1>
              <div className="hidden md:flex items-center space-x-0.5">
                <Link href="/csm/dashboard">
                  <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Dashboard
                  </div>
                </Link>
                <Link href="/csm/reports">
                  <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                    <FileText className="w-4 h-4 mr-1.5" />
                    Reports
                  </div>
                </Link>
                <Link href="/csm/support">
                  <div className="flex items-center px-2 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-medium text-sm transition-colors">
                    <MessageSquare className="w-4 h-4 mr-1.5" />
                    Support Chat
                  </div>
                </Link>
                <Link href="/csm/settings">
                  <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                    <Settings className="w-4 h-4 mr-1.5" />
                    Settings
                  </div>
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button className="relative p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                {queue.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-0.5 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {csmName.charAt(0)}
                  </div>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-semibold">{csmName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">CSM Agent</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Support Queue</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {queue.length} {queue.length === 1 ? 'person' : 'people'} waiting for support
          </p>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{queue.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Queue</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md"
          >
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {queue.filter(q => q.priority >= 8).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {queue.length > 0 ? formatWaitTime(queue[0].waiting_since) : '0m'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Longest Wait</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Queue List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading queue...</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                All Clear!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No one is waiting for support right now.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {queue.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {item.user.full_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {item.user.full_name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.user.email}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(item.priority)}`}>
                          Priority {item.priority}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        {item.conversation.subject}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Waiting: {formatWaitTime(item.waiting_since)}
                        </span>
                        <span>Position: #{index + 1}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => acceptConversation(item)}
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Accept
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
