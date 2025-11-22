'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { requestAgent, checkQueueStatus, closeConversation, supabase } from '@/lib/supabase-functions';

export default function TestEdgeFunctionsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState('');

  // Test data
  const [testUserId, setTestUserId] = useState('');
  const [testUserName, setTestUserName] = useState('Test User');
  const [testUserEmail, setTestUserEmail] = useState('test@example.com');
  const [chatHistory, setChatHistory] = useState(`[
  {
    "role": "user",
    "message": "Hello, I need help with my account",
    "timestamp": "2025-11-23T10:00:00Z"
  },
  {
    "role": "ai",
    "message": "I'd be happy to help! What seems to be the issue?",
    "timestamp": "2025-11-23T10:00:05Z"
  },
  {
    "role": "user",
    "message": "I can't reset my password",
    "timestamp": "2025-11-23T10:00:30Z"
  }
]`);

  const testRequestAgent = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in first');
      }

      const chatSummary = JSON.parse(chatHistory);
      
      const response = await requestAgent({
        user_id: testUserId || user.id,
        user_name: testUserName,
        user_email: testUserEmail,
        chat_summary: chatSummary,
        reason: 'user_requested',
        language_preference: 'English',
        priority: 5,
      });

      setResult(response);
      setConversationId(response.conversation_id);
    } catch (err: any) {
      setError(err.message || 'Failed to request agent');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const testQueueStatus = async () => {
    if (!conversationId) {
      setError('Please request an agent first to get a conversation ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await checkQueueStatus(conversationId);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to check queue status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const testCloseConversation = async () => {
    if (!conversationId) {
      setError('Please request an agent first to get a conversation ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await closeConversation(conversationId, 5);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to close conversation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Edge Functions</h1>
        <p className="text-muted-foreground">
          Test the Supabase Edge Functions for the support chat system
        </p>
      </div>

      {/* Test Data Inputs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Data</CardTitle>
          <CardDescription>Configure test data (leave User ID empty to use current user)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userId">User ID (optional)</Label>
            <Input
              id="userId"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              placeholder="Leave empty to use current user"
            />
          </div>
          <div>
            <Label htmlFor="userName">User Name</Label>
            <Input
              id="userName"
              value={testUserName}
              onChange={(e) => setTestUserName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="userEmail">User Email</Label>
            <Input
              id="userEmail"
              type="email"
              value={testUserEmail}
              onChange={(e) => setTestUserEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="chatHistory">Chat History (JSON)</Label>
            <Textarea
              id="chatHistory"
              value={chatHistory}
              onChange={(e) => setChatHistory(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
          {conversationId && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Current Conversation ID:</strong> {conversationId}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Buttons */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Request Agent</CardTitle>
            <CardDescription>Create new conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testRequestAgent}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Request Agent'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Queue Status</CardTitle>
            <CardDescription>Check conversation status</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testQueueStatus}
              disabled={loading || !conversationId}
              variant="secondary"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Queue Status'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Close Conversation</CardTitle>
            <CardDescription>Close active conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testCloseConversation}
              disabled={loading || !conversationId}
              variant="destructive"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Close'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Function Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
