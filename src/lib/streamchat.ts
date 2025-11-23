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
 */
export function generateStreamToken(userId: string) {
  const client = getStreamServerClient();
  // Add expiration time: 1 hour from now
  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  return client.createToken(userId, exp);
}

/**
 * Create or get a Stream Chat user
 * @param userId - User's UUID from Supabase
 * @param name - User's display name
 */
export async function upsertStreamUser(userId: string, name: string) {
  const client = getStreamServerClient();
  
  await client.upsertUser({
    id: userId,
    name: name,
  });
  
  return generateStreamToken(userId);
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
  
  // Create channel server-side using 'team' type (has open permissions)
  const channel = client.channel('team', channelId, {
    created_by_id: userId,
    members: agentId ? [userId, agentId] : [userId],
  });
  
  // Use getOrCreate to ensure channel exists and is properly initialized
  // This also ensures members can immediately send messages
  await channel.watch();
  
  return channel;
}

/**
 * Add CSM agent to an existing support channel
 * @param conversationId - UUID of the conversation
 * @param agentId - CSM agent's UUID
 */
export async function addAgentToChannel(
  conversationId: string,
  agentId: string,
  createdById?: string
) {
  const client = getStreamServerClient();
  const channelId = `support-${conversationId}`;
  
  // Provide created_by_id so Stream accepts the server-side query
  const channel = client.channel(
    'team',
    channelId,
    createdById ? { created_by_id: createdById } : {}
  );

  // Ensure channel exists and load state
  await channel.query({ watch: false, state: true, presence: false });

  // Add the agent as a member
  await channel.addMembers([agentId]);

  // Notify participants that agent joined
  await channel.sendMessage({
    text: '👋 A support agent has joined the conversation.',
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
  const channel = client.channel('team', channelId);
  
  await channel.sendMessage({
    text: message,
    user_id: 'system',
  });
}
