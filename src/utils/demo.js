/**
 * Discord Keyword & RSS Bot Demo
 * 
 * This script demonstrates how the bot would work with actual data,
 * without requiring Discord or Supabase credentials.
 */

require('dotenv').config();
const { EmbedBuilder } = require('discord.js');

// Mock data
const mockKeywords = [
  { id: 1, keyword: 'announcement', channel_id: '123456789012345678', guild_id: '987654321098765432' },
  { id: 2, keyword: 'important', channel_id: '123456789012345678', guild_id: '987654321098765432' },
  { id: 3, keyword: 'update', channel_id: '876543210987654321', guild_id: '987654321098765432' }
];

const mockRssFeeds = [
  { 
    id: 1, 
    url: 'https://news.example.com/rss', 
    channel_id: '123456789012345678', 
    guild_id: '987654321098765432',
    check_interval: 30,
    last_check: new Date(Date.now() - 3600000) // 1 hour ago
  },
  { 
    id: 2, 
    url: 'https://blog.example.com/feed', 
    channel_id: '876543210987654321', 
    guild_id: '987654321098765432',
    check_interval: 60,
    last_check: new Date(Date.now() - 7200000) // 2 hours ago
  }
];

const mockRssItems = [
  {
    title: 'Important Announcement',
    link: 'https://news.example.com/article1',
    content: 'This is an important announcement about our service.',
    contentSnippet: 'This is an important announcement about our service.',
    guid: '12345',
    isoDate: new Date().toISOString(),
    creator: 'John Doe'
  },
  {
    title: 'New Feature Release',
    link: 'https://news.example.com/article2',
    content: 'We are excited to announce our new feature release.',
    contentSnippet: 'We are excited to announce our new feature release.',
    guid: '67890',
    isoDate: new Date().toISOString(),
    creator: 'Jane Smith'
  }
];

// Mock message for keyword forwarding
const mockMessage = {
  content: 'This is an important announcement about our upcoming update.',
  author: {
    tag: 'User#1234',
    displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/123456789012345678/abcdef1234567890.png'
  },
  channel: {
    id: '111111111111111111',
    name: 'general'
  },
  guild: {
    id: '987654321098765432',
    name: 'Example Server'
  },
  createdAt: new Date(),
  id: '999999999999999999',
  url: 'https://discord.com/channels/987654321098765432/111111111111111111/999999999999999999'
};

// Demo functions
function demoKeywordForwarding() {
  console.log('\n=== KEYWORD FORWARDING DEMO ===\n');
  
  // Display the message
  console.log('Received message in #general:');
  console.log(`${mockMessage.author.tag}: ${mockMessage.content}`);
  
  // Find matching keywords
  const content = mockMessage.content.toLowerCase();
  const matches = mockKeywords.filter(k => content.includes(k.keyword.toLowerCase()));
  
  if (matches.length === 0) {
    console.log('\nNo keywords matched. Message not forwarded.');
    return;
  }
  
  console.log(`\nMatched keywords: ${matches.map(m => m.keyword).join(', ')}`);
  
  // Process each match
  for (const match of matches) {
    console.log(`\nForwarding to channel ID: ${match.channel_id} for keyword: ${match.keyword}`);
    
    // Create embed for the forwarded message
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setAuthor({
        name: mockMessage.author.tag,
        iconURL: mockMessage.author.displayAvatarURL()
      })
      .setDescription(mockMessage.content)
      .addFields(
        { name: 'Keyword', value: match.keyword, inline: true },
        { name: 'Original Channel', value: `#${mockMessage.channel.name}`, inline: true },
        { name: 'Jump to Message', value: `[Click Here](${mockMessage.url})`, inline: true }
      )
      .setTimestamp(mockMessage.createdAt)
      .setFooter({ text: `Message ID: ${mockMessage.id}` });
    
    // Display the embed as JSON
    console.log('Forwarded message embed:');
    console.log(JSON.stringify(embed.toJSON(), null, 2));
  }
}

function demoRssFeeds() {
  console.log('\n=== RSS FEED DEMO ===\n');
  
  // Display the RSS feeds
  console.log('Configured RSS feeds:');
  for (const feed of mockRssFeeds) {
    console.log(`- ${feed.url} -> Channel ID: ${feed.channel_id} (Check every ${feed.check_interval} minutes)`);
  }
  
  // Simulate checking feeds
  console.log('\nChecking RSS feeds...');
  
  for (const feed of mockRssFeeds) {
    console.log(`\nProcessing feed: ${feed.url}`);
    
    // Display items
    for (const item of mockRssItems) {
      console.log(`Found new item: ${item.title}`);
      
      // Create embed for the RSS item
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(item.title)
        .setURL(item.link)
        .setDescription(item.contentSnippet)
        .setAuthor({
          name: item.creator || 'Unknown Author'
        })
        .setTimestamp(new Date(item.isoDate))
        .setFooter({
          text: `From RSS Feed`
        });
      
      // Display the embed as JSON
      console.log(`Posting to channel ID: ${feed.channel_id}`);
      console.log('RSS item embed:');
      console.log(JSON.stringify(embed.toJSON(), null, 2));
      
      // Only show one item per feed for brevity
      break;
    }
  }
}

function demoCommands() {
  console.log('\n=== COMMAND DEMO ===\n');
  
  const prefix = process.env.PREFIX || '!';
  
  // Keyword commands
  console.log('=== Keyword Commands ===');
  console.log(`${prefix}keyword add announcement #announcements`);
  console.log('> ✅ Keyword `announcement` added. Messages containing this keyword will be forwarded to #announcements.');
  
  console.log(`\n${prefix}keyword list`);
  console.log('> Keyword Forwarding Configuration:');
  console.log('> Channel #announcements: `announcement`, `important`');
  console.log('> Channel #updates: `update`');
  
  console.log(`\n${prefix}keyword remove important #announcements`);
  console.log('> ✅ Keyword `important` removed from channel #announcements.');
  
  // RSS commands
  console.log('\n=== RSS Commands ===');
  console.log(`${prefix}rss add https://news.example.com/rss #news`);
  console.log('> ✅ RSS feed added. Updates will be posted to #news every 30 minutes.');
  
  console.log(`\n${prefix}rss list`);
  console.log('> RSS Feed Configuration:');
  console.log('> Channel #news: https://news.example.com/rss (30min)');
  console.log('> Channel #blog: https://blog.example.com/feed (60min)');
  
  console.log(`\n${prefix}rss check`);
  console.log('> Checking RSS feeds, this may take a moment...');
  console.log('> ✅ RSS feeds checked successfully.');
  
  console.log(`\n${prefix}rss remove https://blog.example.com/feed`);
  console.log('> ✅ RSS feed removed.');
  
  // Help command
  console.log('\n=== Help Command ===');
  console.log(`${prefix}help`);
  console.log('> Discord Keyword & RSS Bot Commands:');
  console.log(`> ${prefix}keyword add <keyword> <channelId> - Add a keyword to forward to a channel`);
  console.log(`> ${prefix}keyword remove <keyword> <channelId> - Remove a keyword-channel mapping`);
  console.log(`> ${prefix}keyword list - List all keyword-channel mappings`);
  console.log(`> ${prefix}rss add <url> <channelId> [checkInterval] - Add an RSS feed to monitor`);
  console.log(`> ${prefix}rss remove <url> - Remove an RSS feed`);
  console.log(`> ${prefix}rss list - List all monitored RSS feeds`);
  console.log(`> ${prefix}rss check - Force check all RSS feeds now`);
  console.log(`> ${prefix}help - Show this help message`);
}

// Run the demo
console.log('=== DISCORD KEYWORD & RSS BOT DEMO ===');
console.log('This demo shows how the bot would work with actual data.\n');

demoKeywordForwarding();
demoRssFeeds();
demoCommands();

console.log('\n=== DEMO COMPLETE ===');
console.log('To run the actual bot, please configure your .env file with:');
console.log('1. Discord bot token');
console.log('2. Supabase URL and key');
console.log('Then run: npm start');
