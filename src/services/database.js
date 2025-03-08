const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
let supabase;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
    console.log('Supabase client initialized');
  } else {
    console.log('Supabase credentials not found, using mock database');
    // Mock database for testing
    supabase = {
      from: () => ({
        insert: () => ({ select: () => Promise.resolve({ data: [{ id: 1 }], error: null }) }),
        delete: () => Promise.resolve({ data: null, error: null }),
        select: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        match: () => ({ select: () => Promise.resolve({ data: null, error: null }) }),
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) })
      })
    };
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  process.exit(1);
}

// Keyword related functions
const keywordService = {
  // Add a new keyword-channel mapping
  async addKeyword(keyword, channelId, guildId) {
    const { data, error } = await supabase
      .from('keywords')
      .insert([
        { 
          keyword: keyword.toLowerCase(), 
          channel_id: channelId, 
          guild_id: guildId 
        }
      ])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, message: 'This keyword is already set up for this channel.' };
      }
      console.error('Error adding keyword:', error);
      return { success: false, message: 'Failed to add keyword.' };
    }

    return { success: true, data };
  },

  // Remove a keyword-channel mapping
  async removeKeyword(keyword, channelId, guildId) {
    const { data, error } = await supabase
      .from('keywords')
      .delete()
      .match({ 
        keyword: keyword.toLowerCase(), 
        channel_id: channelId, 
        guild_id: guildId 
      });

    if (error) {
      console.error('Error removing keyword:', error);
      return { success: false, message: 'Failed to remove keyword.' };
    }

    return { success: true, data };
  },

  // Get all keywords for a guild
  async getKeywords(guildId) {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('guild_id', guildId);

    if (error) {
      console.error('Error getting keywords:', error);
      return { success: false, message: 'Failed to get keywords.' };
    }

    return { success: true, data };
  },

  // Log a forwarded message
  async logForwardedMessage(originalMessageId, originalChannelId, forwardedChannelId, keyword, guildId) {
    const { error } = await supabase
      .from('forwarded_messages')
      .insert([
        {
          original_message_id: originalMessageId,
          original_channel_id: originalChannelId,
          forwarded_channel_id: forwardedChannelId,
          keyword,
          guild_id: guildId
        }
      ]);

    if (error) {
      console.error('Error logging forwarded message:', error);
    }
  }
};

// RSS feed related functions
const rssService = {
  // Add a new RSS feed
  async addRssFeed(url, channelId, guildId, checkInterval = null) {
    const interval = checkInterval || parseInt(process.env.DEFAULT_RSS_CHECK_INTERVAL) || 30;
    
    const { data, error } = await supabase
      .from('rss_feeds')
      .insert([
        { 
          url, 
          channel_id: channelId, 
          guild_id: guildId,
          check_interval: interval
        }
      ])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, message: 'This RSS feed is already set up for this channel.' };
      }
      console.error('Error adding RSS feed:', error);
      return { success: false, message: 'Failed to add RSS feed.' };
    }

    return { success: true, data };
  },

  // Remove an RSS feed
  async removeRssFeed(url, channelId, guildId) {
    const { data, error } = await supabase
      .from('rss_feeds')
      .delete()
      .match({ 
        url, 
        channel_id: channelId, 
        guild_id: guildId 
      });

    if (error) {
      console.error('Error removing RSS feed:', error);
      return { success: false, message: 'Failed to remove RSS feed.' };
    }

    return { success: true, data };
  },

  // Get all RSS feeds
  async getRssFeeds(guildId = null) {
    let query = supabase
      .from('rss_feeds')
      .select('*');
    
    if (guildId) {
      query = query.eq('guild_id', guildId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting RSS feeds:', error);
      return { success: false, message: 'Failed to get RSS feeds.' };
    }

    return { success: true, data };
  },

  // Update last check time for an RSS feed
  async updateLastCheck(feedId) {
    const { error } = await supabase
      .from('rss_feeds')
      .update({ last_check: new Date() })
      .eq('id', feedId);

    if (error) {
      console.error('Error updating last check time:', error);
    }
  },

  // Check if an RSS item has been processed
  async isItemProcessed(feedId, itemId) {
    const { data, error } = await supabase
      .from('rss_items')
      .select('*')
      .eq('feed_id', feedId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (error) {
      console.error('Error checking if item is processed:', error);
      return true; // Assume processed to avoid duplicates
    }

    return !!data;
  },

  // Mark an RSS item as processed
  async markItemProcessed(feedId, itemId, publishedAt = null) {
    const { error } = await supabase
      .from('rss_items')
      .insert([
        { 
          feed_id: feedId, 
          item_id: itemId,
          published_at: publishedAt
        }
      ]);

    if (error && error.code !== '23505') { // Ignore unique violation
      console.error('Error marking item as processed:', error);
    }
  }
};

module.exports = {
  keywordService,
  rssService
};
