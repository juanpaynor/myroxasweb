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
  Users,
  Search,
  Trash2,
  X,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';

type Conversation = {
  id: string;
  user_id: string;
  subject: string;
  priority: number;
  status: string;
  created_at: string;
  assigned_at: string | null;
  assigned_agent_id: string | null;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  agent?: {
    full_name: string;
  };
};

type FilterType = 'all' | 'queue' | 'active' | 'resolved';

export default function CSMSupportPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [csmName, setCsmName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
    fetchConversations();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter conversations based on search and filter type
    let filtered = conversations;

    // Apply status filter
    if (filterType === 'queue') {
      filtered = filtered.filter(c => c.status === 'waiting_agent');
    } else if (filterType === 'active') {
      filtered = filtered.filter(c => c.status === 'with_agent');
    } else if (filterType === 'resolved') {
      filtered = filtered.filter(c => c.status === 'resolved');
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.user.full_name.toLowerCase().includes(query) ||
        c.user.email.toLowerCase().includes(query) ||
        c.subject.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
      );
    }

    setFilteredConversations(filtered);
  }, [conversations, searchQuery, filterType]);

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

  async function fetchConversations() {
    try {
      const client = await supabase;
      
      // Fetch all active conversations (not deleted)
      const { data, error } = await client
        .from('support_conversations')
        .select('*')
        .in('status', ['waiting_agent', 'with_agent', 'resolved'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user details for each conversation
      const conversationsWithUsers = await Promise.all(
        (data || []).map(async (conv: any) => {
          const { data: userData } = await client
            .from('user_profiles')
            .select('id, full_name, email')
            .eq('id', conv.user_id)
            .single();

          let agentData = null;
          if (conv.assigned_agent_id) {
            const { data: agent } = await client
              .from('user_profiles')
              .select('full_name')
              .eq('id', conv.assigned_agent_id)
              .single();
            agentData = agent;
          }

          return {
            ...conv,
            user: userData || { id: conv.user_id, full_name: 'Unknown', email: '' },
            agent: agentData,
          };
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function openConversation(conversation: Conversation) {
    try {
      const client = await supabase;
      const { data: { session } } = await client.auth.getSession();
      if (!session) return;

      // If conversation is not yet assigned, assign it to this agent
      if (conversation.status === 'waiting_agent') {
        const { error: updateError } = await client
          .from('support_conversations')
          .update({
            status: 'with_agent',
            assigned_agent_id: session.user.id,
            assigned_at: new Date().toISOString(),
          })
          .eq('id', conversation.id);

        if (updateError) {
          console.error('Error updating conversation:', updateError);
        }

        // Add agent to Stream Chat channel
        try {
          const response = await fetch('/api/support/conversations/add-agent', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversation_id: conversation.id,
              agent_id: session.user.id,
            }),
          });

          if (!response.ok) {
            console.error('Failed to add agent to Stream channel');
          }
        } catch (streamError) {
          console.error('Error adding agent to Stream:', streamError);
        }
      } else if (conversation.assigned_agent_id && conversation.assigned_agent_id !== session.user.id) {
        // Conversation already assigned to another agent
        alert(`This conversation is already being handled by ${conversation.agent?.full_name || 'another agent'}`);
        return;
      }

      // Navigate to chat interface
      router.push(`/csm/support/chat/${conversation.id}`);
    } catch (error) {
      console.error('Error opening conversation:', error);
      alert('Failed to open conversation');
    }
  }

  async function deleteConversation(conversationId: string) {
    if (!confirm('Are you sure you want to permanently delete this conversation? This cannot be undone.')) {
      return;
    }

    try {
      const client = await supabase;
      const { data: { session } } = await client.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/support/conversations/${conversationId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Remove from selected if it was selected
      const newSelected = new Set(selectedIds);
      newSelected.delete(conversationId);
      setSelectedIds(newSelected);

      // Refresh list
      fetchConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation');
    }
  }

  async function resolveConversation(conversationId: string) {
    if (!confirm('Mark this conversation as resolved? This will close the conversation.')) {
      return;
    }

    try {
      const client = await supabase;

      // Update conversation status to resolved
      const { error } = await client
        .from('support_conversations')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) throw error;

      // Refresh list
      fetchConversations();
    } catch (error) {
      console.error('Error resolving conversation:', error);
      alert('Failed to resolve conversation');
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) {
      alert('No conversations selected');
      return;
    }

    if (!confirm(`Delete ${selectedIds.size} conversation(s)? This cannot be undone.`)) {
      return;
    }

    try {
      const client = await supabase;
      const { data: { session } } = await client.auth.getSession();
      if (!session) return;

      for (const id of selectedIds) {
        await fetch(`/api/support/conversations/${id}/delete`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
      }

      setSelectedIds(new Set());
      fetchConversations();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Failed to delete conversations');
    }
  }

  function toggleSelection(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredConversations.length && filteredConversations.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredConversations.map(c => c.id)));
    }
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function getStatusBadge(status: string) {
    if (status === 'waiting_agent') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          Waiting
        </span>
      );
    } else if (status === 'with_agent') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          Active
        </span>
      );
    } else if (status === 'resolved') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Resolved
        </span>
      );
    }
    return null;
  }

  async function handleLogout() {
    const client = await supabase;
    await client.auth.signOut();
    router.push('/login/csm');
  }

  const queueCount = conversations.filter(c => c.status === 'waiting_agent').length;
  const activeCount = conversations.filter(c => c.status === 'with_agent').length;
  const resolvedCount = conversations.filter(c => c.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
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
                {queueCount > 0 && (
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conversation Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {conversations.length} total conversations
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, subject, or conversation ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({conversations.length})
            </button>
            <button
              onClick={() => setFilterType('queue')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'queue'
                  ? 'bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Queue ({queueCount})
            </button>
            <button
              onClick={() => setFilterType('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'active'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterType('resolved')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'resolved'
                  ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <button
              onClick={bulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No Results Found' : 'No Conversations'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search query.' : 'No active conversations at the moment.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="w-10 px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredConversations.length && filteredConversations.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                    </th>
                    <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="w-44 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="w-56 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredConversations.map((conversation) => (
                    <tr
                      key={conversation.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(conversation.id)}
                          onChange={() => toggleSelection(conversation.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2">
                            {conversation.user.full_name.charAt(0)}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {conversation.user.full_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conversation.user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 dark:text-white truncate">
                          {conversation.subject}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(conversation.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {conversation.priority}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTime(conversation.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conversation.agent?.full_name || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openConversation(conversation)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                          >
                            {conversation.status === 'waiting_agent' ? 'Open' : 'View'}
                          </button>
                          {conversation.status === 'with_agent' && (
                            <button
                              onClick={() => resolveConversation(conversation.id)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            onClick={() => deleteConversation(conversation.id)}
                            className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
