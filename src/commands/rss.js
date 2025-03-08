const { rssService } = require('../services/database');
const { checkAllFeeds, processFeed } = require('../services/rss');
const { EmbedBuilder } = require('discord.js');
const Parser = require('rss-parser');

const parser = new Parser({
  headers: {
    'User-Agent': 'Discord RSS Bot/1.0'
  }
});

// Handle the RSS command
async function handleRssCommand(message, args) {
  const subcommand = args[0]?.toLowerCase();
  const guildId = message.guild.id;
  
  if (!subcommand) {
    return message.reply('Usage: `!rss add|remove|list|check <url> <channelId> [checkInterval]`');
  }
  
  switch (subcommand) {
    case 'add':
      return handleAddRss(message, args.slice(1), guildId);
    case 'remove':
      return handleRemoveRss(message, args.slice(1), guildId);
    case 'list':
      return handleListRss(message, guildId);
    case 'check':
      return handleCheckRss(message);
    default:
      return message.reply('Unknown subcommand. Use `add`, `remove`, `list`, or `check`.');
  }
}

// Handle adding an RSS feed
async function handleAddRss(message, args, guildId) {
  const url = args[0];
  const channelId = args[1]?.replace(/[<#>]/g, ''); // Remove <#> if present
  const checkInterval = args[2] ? parseInt(args[2]) : null;
  
  if (!url || !channelId) {
    return message.reply('Usage: `!rss add <url> <channelId> [checkInterval]`');
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    return message.reply('Invalid URL. Please provide a valid RSS feed URL.');
  }
  
  // Validate channel exists
  try {
    const channel = await message.client.channels.fetch(channelId);
    if (!channel) {
      return message.reply('Channel not found. Please provide a valid channel ID.');
    }
  } catch (error) {
    return message.reply('Channel not found. Please provide a valid channel ID.');
  }
  
  // Validate RSS feed
  try {
    await message.channel.send('Validating RSS feed, please wait...');
    await parser.parseURL(url);
  } catch (error) {
    return message.reply(`Failed to parse RSS feed: ${error.message}`);
  }
  
  // Add RSS feed to database
  const { success, data, message: responseMessage } = await rssService.addRssFeed(
    url, 
    channelId, 
    guildId, 
    checkInterval
  );
  
  if (success) {
    const interval = data[0].check_interval || parseInt(process.env.DEFAULT_RSS_CHECK_INTERVAL) || 30;
    return message.reply(`✅ RSS feed added. Updates will be posted to <#${channelId}> every ${interval} minutes.`);
  } else {
    return message.reply(`❌ ${responseMessage || 'Failed to add RSS feed.'}`);
  }
}

// Handle removing an RSS feed
async function handleRemoveRss(message, args, guildId) {
  const url = args[0];
  const channelId = args[1]?.replace(/[<#>]/g, ''); // Remove <#> if present
  
  if (!url) {
    return message.reply('Usage: `!rss remove <url> [channelId]`');
  }
  
  // Remove RSS feed from database
  const { success, message: responseMessage } = await rssService.removeRssFeed(
    url, 
    channelId || '%', // If no channel specified, use wildcard
    guildId
  );
  
  if (success) {
    return message.reply(`✅ RSS feed removed.`);
  } else {
    return message.reply(`❌ ${responseMessage || 'Failed to remove RSS feed.'}`);
  }
}

// Handle listing RSS feeds
async function handleListRss(message, guildId) {
  const { success, data: feeds, message: responseMessage } = await rssService.getRssFeeds(guildId);
  
  if (!success) {
    return message.reply(`❌ ${responseMessage || 'Failed to list RSS feeds.'}`);
  }
  
  if (!feeds || feeds.length === 0) {
    return message.reply('No RSS feeds configured for this server.');
  }
  
  // Group feeds by channel
  const feedsByChannel = {};
  feeds.forEach(f => {
    if (!feedsByChannel[f.channel_id]) {
      feedsByChannel[f.channel_id] = [];
    }
    feedsByChannel[f.channel_id].push({
      url: f.url,
      interval: f.check_interval
    });
  });
  
  // Create embed
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('RSS Feed Configuration')
    .setDescription('Updates from these RSS feeds will be posted to the specified channels.')
    .setTimestamp();
  
  // Add fields for each channel
  for (const [channelId, channelFeeds] of Object.entries(feedsByChannel)) {
    embed.addFields({
      name: `Channel <#${channelId}>`,
      value: channelFeeds.map(f => `[Link](${f.url}) (${f.interval}min)`).join('\n')
    });
  }
  
  return message.reply({ embeds: [embed] });
}

// Handle checking RSS feeds
async function handleCheckRss(message) {
  await message.reply('Checking RSS feeds, this may take a moment...');
  
  try {
    await checkAllFeeds(message.client);
    return message.reply('✅ RSS feeds checked successfully.');
  } catch (error) {
    console.error('Error checking RSS feeds:', error);
    return message.reply(`❌ Error checking RSS feeds: ${error.message}`);
  }
}

module.exports = {
  handleRssCommand
};
