-- Create conversations table for DMs
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type TEXT NOT NULL DEFAULT 'direct' CHECK (conversation_type IN ('direct')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

-- Create conversation participants (many-to-many)
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  edited BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL
);

-- Create message attachments table
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('video', 'audio', 'post', 'image', 'file')),
  content_id UUID,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create message reactions table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create typing indicators table
CREATE TABLE typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_typing_indicators_conversation ON typing_indicators(conversation_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is participant
CREATE OR REPLACE FUNCTION is_conversation_participant(_conversation_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = _conversation_id
    AND user_id = _user_id
  )
$$;

-- RLS Policies for conversations
CREATE POLICY "Users view conversations they participate in"
ON conversations FOR SELECT
USING (is_conversation_participant(id, auth.uid()));

CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Participants update conversation"
ON conversations FOR UPDATE
USING (is_conversation_participant(id, auth.uid()));

-- RLS Policies for conversation_participants
CREATE POLICY "Users view participants in their conversations"
ON conversation_participants FOR SELECT
USING (user_id = auth.uid() OR is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can join conversations"
ON conversation_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own participation"
ON conversation_participants FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can leave conversations"
ON conversation_participants FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users view messages in their conversations"
ON messages FOR SELECT
USING (is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Participants can send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() 
  AND is_conversation_participant(conversation_id, auth.uid())
);

CREATE POLICY "Users update own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Users delete own messages"
ON messages FOR DELETE
USING (sender_id = auth.uid());

-- RLS Policies for message_attachments
CREATE POLICY "Users view attachments in accessible messages"
ON message_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages
    WHERE messages.id = message_attachments.message_id
    AND is_conversation_participant(messages.conversation_id, auth.uid())
  )
);

CREATE POLICY "Users can add attachments to own messages"
ON message_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM messages
    WHERE messages.id = message_attachments.message_id
    AND messages.sender_id = auth.uid()
  )
);

-- RLS Policies for message_reactions
CREATE POLICY "Users view reactions in accessible messages"
ON message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages
    WHERE messages.id = message_reactions.message_id
    AND is_conversation_participant(messages.conversation_id, auth.uid())
  )
);

CREATE POLICY "Users can react to accessible messages"
ON message_reactions FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM messages
    WHERE messages.id = message_reactions.message_id
    AND is_conversation_participant(messages.conversation_id, auth.uid())
  )
);

CREATE POLICY "Users delete own reactions"
ON message_reactions FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for typing_indicators
CREATE POLICY "Users view typing in their conversations"
ON typing_indicators FOR SELECT
USING (is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can indicate typing"
ON typing_indicators FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND is_conversation_participant(conversation_id, auth.uid())
);

CREATE POLICY "Users update own typing indicator"
ON typing_indicators FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users delete own typing indicator"
ON typing_indicators FOR DELETE
USING (user_id = auth.uid());

-- Trigger to update last_message_at on conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to clean up old typing indicators (>5 seconds old)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE started_at < NOW() - INTERVAL '5 seconds';
END;
$$;

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;