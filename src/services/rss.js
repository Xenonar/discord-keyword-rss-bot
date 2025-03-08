const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const { rssService } = require('./database');

const parser = new Parser({
  headers: {
    'User-Agent': 'Discord RSS Bot/1.0'
  }
});

// Process a single RSS feed
async function processFeed(feed, client) {
  try {
    // Parse the RSS feed
    const parsedFeed = await parser.parseURL(feed.url);
    
    // Get the target channel
    const channel = await client.channels.fetch(feed.channel_id);
    if (!channel) {
      console.error(`Channel ${feed.channel_id} not found for RSS feed ${feed.url}`);
      return;
    }

    // Process items in reverse order (oldest first) to maintain chronological order
    const items = parsedFeed.items.reverse();
    
    for (const item of items) {
      // Use guid or link as unique identifier
      const itemId = item.guid || item.link;
      if (!itemId) continue;
      
      // Check if we've already processed this item
      const isProcessed = await rssService.isItemProcessed(feed.id, itemId);
      if (isProcessed) continue;
      
      // Create embed for the item
      const embed = createRssEmbed(item, parsedFeed);
      
      // Send the message
      await channel.send({ embeds: [embed] });
      
      // Mark as processed
      await rssService.markItemProcessed(
        feed.id, 
        itemId, 
        item.isoDate ? new Date(item.isoDate) : null
      );
    }
    
    // Update last check time
    await rssService.updateLastCheck(feed.id);
    
  } catch (error) {
    console.error(`Error processing RSS feed ${feed.url}:`, error);
  }
}

// Create a Discord embed for an RSS item
function createRssEmbed(item, feed) {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(item.title || 'No Title')
    .setURL(item.link || '')
    .setTimestamp(item.isoDate ? new Date(item.isoDate) : null)
    .setFooter({ 
      text: `From ${feed.title || 'RSS Feed'}`,
      iconURL: feed.image?.url || null
    });
  
  // Add description (content or snippet)
  if (item.contentSnippet) {
    // Limit to 4000 characters (Discord embed limit is 4096)
    const description = item.contentSnippet.length > 4000 
      ? item.contentSnippet.substring(0, 3997) + '...' 
      : item.contentSnippet;
    
    embed.setDescription(description);
  }
  
  // Add author if available
  if (item.creator || item.author) {
    embed.setAuthor({ name: item.creator || item.author || 'Unknown Author' });
  }
  
  // Add thumbnail if available
  const media = item.enclosure?.url || item['media:content']?.$.url || item.image?.url;
  if (media) {
    embed.setImage(media);
  }
  
  return embed;
}

// Check all RSS feeds
async function checkAllFeeds(client) {
  try {
    const { success, data: feeds, message } = await rssService.getRssFeeds();
    
    if (!success) {
      console.error('Failed to get RSS feeds:', message);
      return;
    }
    
    console.log(`Checking ${feeds.length} RSS feeds...`);
    
    for (const feed of feeds) {
      await processFeed(feed, client);
    }
    
    console.log('Finished checking RSS feeds');
  } catch (error) {
    console.error('Error checking RSS feeds:', error);
  }
}

module.exports = {
  checkAllFeeds,
  processFeed
};
