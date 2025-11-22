import { StreamChat } from 'stream-chat';

// Server-side Stream Chat client (lazy initialization)
let serverClient: StreamChat | null = null;

function getCredentials() {
  const apiKey = process.env.STREAM_CHAT_API_KEY;
  const apiSecret = process.env.STREAM_CHAT_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('Stream Chat credentials are missing. Make sure STREAM_CHAT_API_KEY and STREAM_CHAT_SECRET are set.');
  }
  
  return { apiKey, apiSecret };
}

export function getStreamServerClient() {
  if (!serverClient) {
    const { apiKey, apiSecret } = getCredentials();
    serverClient = StreamChat.getInstance(apiKey, apiSecret);
  }
  return serverClient;
}

/**
 * Generate a Stream Chat token for a user
 * @param userId - User's UUID from Supabase
 * @param role - User's role in the chat system (user, agent, admin)
 */
export function generateStreamToken(userId: string, role: 'user' | 'agent' | 'admin' = 'user') {
  const client = getStreamServerClient();
  return client.createToken(userId);
}

/**
 * Create or get a Stream Chat user
 * @param userId - User's UUID from Supabase
 * @param name - User's display name
 * @param role - Stream Chat role (user, agent, admin)
 */
export async function upsertStreamUser(
  userId: string, 
  name: string, 
  role: 'user' | 'agent' | 'admin' = 'user'
) {
  const client = getStreamServerClient();
  
  await client.upsertUser({
    id: userId,
    name: name,
    role: role,
  });
  
  return generateStreamToken(userId, role);
}

/**
 * Create a support channel for agent conversation
 * @param conversationId - UUID of the conversation
 * @param userId - User's UUID
 * @param agentId - CSM agent's UUID (optional, assigned later)
 */
export async function createSupportChannel(
  conversationId: string,
  userId: string,
  agentId?: string
) {
  const client = getStreamServerClient();
  
  const channelId = `support-${conversationId}`;
  const channel = client.channel('messaging', channelId, {
    created_by_id: userId,
    members: agentId ? [userId, agentId] : [userId],
  });
  
  await channel.create();
  
  return channel;
}

/**
 * Add CSM agent to an existing support channel
 * @param conversationId - UUID of the conversation
 * @param agentId - CSM agent's UUID
 */
export async function addAgentToChannel(conversationId: string, agentId: string) {
  const client = getStreamServerClient();
  const channelId = `support-${conversationId}`;
  const channel = client.channel('messaging', channelId);
  
  await channel.addMembers([agentId]);
  
  // Send system message that agent joined
  await channel.sendMessage({
    text: 'A support agent has joined the conversation',
    user_id: 'system',
  });
}

/**
 * Send system message to a channel
 * @param conversationId - UUID of the conversation
 * @param message - Message text
 */
export async function sendSystemMessage(conversationId: string, message: string) {
  const client = getStreamServerClient();
  const channelId = `support-${conversationId}`;
  const channel = client.channel('messaging', channelId);
  
  await channel.sendMessage({
    text: message,
    user_id: 'system',
  });
}
