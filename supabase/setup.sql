-- Create keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(keyword, channel_id, guild_id)
);

-- Create RSS feeds table
CREATE TABLE IF NOT EXISTS rss_feeds (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  check_interval INTEGER DEFAULT 30, -- in minutes
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(url, channel_id, guild_id)
);

-- Create RSS items table to track processed items
CREATE TABLE IF NOT EXISTS rss_items (
  id SERIAL PRIMARY KEY,
  feed_id INTEGER REFERENCES rss_feeds(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL, -- guid or link
  published_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feed_id, item_id)
);

-- Create forwarded messages table for logging
CREATE TABLE IF NOT EXISTS forwarded_messages (
  id SERIAL PRIMARY KEY,
  original_message_id TEXT NOT NULL,
  original_channel_id TEXT NOT NULL,
  forwarded_channel_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  forwarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_keywords_guild_id ON keywords(guild_id);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_guild_id ON rss_feeds(guild_id);
CREATE INDEX IF NOT EXISTS idx_rss_items_feed_id ON rss_items(feed_id);
CREATE INDEX IF NOT EXISTS idx_forwarded_messages_guild_id ON forwarded_messages(guild_id);
