'use client';

import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  User,
  FileText,
  Calendar,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { StreamChat } from 'stream-chat';
import { 
  Chat, 
  Channel, 
  MessageInput, 
  MessageList, 
  Window,
  Thread
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';

type ConversationDetails = {
  id: string;
  user_id: string;
  subject: string;
  priority: number;
  status: string;
  ai_conversation_summary: string | null;
  created_at: string;
  assigned_at: string | null;
  user: {
    full_name: string;
    email: string;
  };
};

export default function CSMChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<any>(null);
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showUserDetails, setShowUserDetails] = useState(true);
  const isInitializing = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && !isInitializing.current) {
      isInitializing.current = true;
      initChat();
    }

    return () => {
      if (chatClient) {
        chatClient.disconnectUser().catch(console.error);
      }
    };
  }, [conversationId]);

  async function initChat() {
    try {
      const client = await supabase;
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        router.push('/login/csm');
        return;
      }

      // Fetch conversation details
      const { data: convData, error: convError } = await client
        .from('support_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;
      
      // Fetch user profile separately
      const { data: userData, error: userError } = await client
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', convData.user_id)
        .single();

      if (userError) {
        console.warn('Could not fetch user profile:', userError);
      }

      const conversationWithUser = {
        ...convData,
        user: userData || { full_name: 'Unknown User', email: 'N/A' }
      };

      if (convData.assigned_agent_id !== session.user.id) {
        alert('This conversation is not assigned to you');
        router.push('/csm/support');
        return;
      }

      setConversation(conversationWithUser as any);

      // Initialize Stream Chat
      const streamClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!);
      
      // Generate token for CSM agent
      const tokenResponse = await fetch('/api/support/agent/token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!tokenResponse.ok) throw new Error('Failed to get Stream token');
      const { token } = await tokenResponse.json();

      // Get CSM profile for display name
      const { data: csmProfile } = await client
        .from('user_profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

      const csmName = csmProfile?.full_name || 'Support Agent';

      await streamClient.connectUser(
        {
          id: session.user.id,
          name: csmName,
        },
        token
      );

      const channelInstance = streamClient.channel(
        'team',
        `support-${conversationId}`,
        {}
      );

      await channelInstance.watch();

      setChatClient(streamClient);
      setChannel(channelInstance);
      setLoading(false);
      hasInitialized.current = true;
      isInitializing.current = false;
    } catch (error) {
      console.error('Error initializing chat:', error);
      isInitializing.current = false;
      alert('Failed to load chat');
      router.push('/csm/support');
    }
  }

  async function handleResolve() {
    if (!resolutionNote.trim()) {
      alert('Please enter resolution notes');
      return;
    }

    try {
      const client = await supabase;

      // Update conversation status to resolved
      const { error: updateError } = await client
        .from('support_conversations')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (updateError) throw updateError;

      // Send system message to chat
      if (channel) {
        await channel.sendMessage({
          text: `✅ Conversation resolved. ${resolutionNote ? `Notes: ${resolutionNote}` : ''}`,
          user_id: 'system',
        });
      }

      router.push('/csm/support');
    } catch (error) {
      console.error('Error resolving conversation:', error);
      alert('Failed to resolve conversation');
    }
  }

  async function handleCloseChat() {
    if (!confirm('Close this chat and return it to waiting status?')) {
      return;
    }

    try {
      const client = await supabase;

      // Update conversation status back to 'waiting_agent' and remove agent assignment
      const { error: updateError } = await client
        .from('support_conversations')
        .update({
          status: 'waiting_agent',
          assigned_agent_id: null,
          assigned_at: null,
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Send system message
      if (channel) {
        try {
          await channel.sendMessage({
            text: '💬 Agent has left the conversation. Another agent can respond when available.',
            user_id: 'system',
          });
        } catch (msgError) {
          console.error('Message error:', msgError);
        }
      }

      router.push('/csm/support');
    } catch (error) {
      console.error('Error closing chat:', error);
      alert('Failed to close chat: ' + (error as any).message);
    }
  }

  async function handleDeleteConversation() {
    if (!confirm('⚠️ DELETE PERMANENTLY?\n\nThis will delete the entire conversation and all messages. This action CANNOT be undone.\n\nAre you absolutely sure?')) {
      return;
    }

    try {
      const client = await supabase;
      const { data: { session } } = await client.auth.getSession();
      
      if (!session) {
        alert('You must be logged in to delete conversations');
        return;
      }

      const response = await fetch(`/api/support/conversations/${conversationId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete conversation');
      }

      // Navigate back to support queue
      router.push('/csm/support');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete conversation');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chatClient || !channel || !conversation) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/csm/support">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </Link>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {conversation.user.full_name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {conversation.subject}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              conversation.priority >= 8
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : conversation.priority >= 5
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              Priority {conversation.priority}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUserDetails(!showUserDetails)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              {showUserDetails ? 'Hide' : 'Show'} Details
            </button>
            <button
              onClick={handleDeleteConversation}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
              title="Delete conversation permanently"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
            <button
              onClick={handleCloseChat}
              className="px-3 py-2 text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              Close Chat
            </button>
            <button
              onClick={() => setShowResolveModal(true)}
              className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Resolve & Close
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${showUserDetails ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
          <Chat client={chatClient} theme="messaging light">
            <Channel channel={channel}>
              <Window>
                <MessageList />
                <MessageInput />
              </Window>
              <Thread />
            </Channel>
          </Chat>
        </div>

        {/* User Details Sidebar */}
        {showUserDetails && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 bg-white dark:bg-gray-800 p-4 overflow-y-auto"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">User Information</h3>
            
            <div className="space-y-4">
              {/* User Profile */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {conversation.user.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {conversation.user.full_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {conversation.user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              {conversation.ai_conversation_summary && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                    AI Conversation History
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(() => {
                      try {
                        const history = typeof conversation.ai_conversation_summary === 'string' 
                          ? JSON.parse(conversation.ai_conversation_summary)
                          : conversation.ai_conversation_summary;
                        
                        return Array.isArray(history) ? history.map((msg: any, idx: number) => (
                          <div 
                            key={idx} 
                            className={`p-2 rounded text-sm ${
                              msg.role === 'user' 
                                ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700' 
                                : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}
                          >
                            <div className="flex items-center mb-1">
                              <span className={`font-semibold text-xs uppercase ${
                                msg.role === 'user' 
                                  ? 'text-gray-600 dark:text-gray-400' 
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}>
                                {msg.role === 'user' ? '👤 User' : '🤖 AI'}
                              </span>
                              {msg.timestamp && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {msg.message}
                            </p>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {JSON.stringify(history)}
                          </p>
                        );
                      } catch (e) {
                        return (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {conversation.ai_conversation_summary}
                          </p>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Quick Actions</h4>
                <button className="w-full p-3 text-left bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center text-sm">
                  <FileText className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                  View User Reports
                </button>
                <button className="w-full p-3 text-left bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                  View Appointments
                </button>
              </div>

              {/* Conversation Details */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Conversation Details</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Started:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(conversation.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Accepted:</span>
                    <span className="text-gray-900 dark:text-white">
                      {conversation.assigned_at
                        ? new Date(conversation.assigned_at).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="text-gray-900 dark:text-white capitalize">
                      {conversation.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resolve Conversation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide notes about how this issue was resolved:
            </p>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter resolution notes..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
