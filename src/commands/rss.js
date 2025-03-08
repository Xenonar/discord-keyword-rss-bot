const { rssService } = require('../services/database');
const { checkAllFeeds, processFeed } = require('../services/rss');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Parser = require('rss-parser');

const parser = new Parser({
  headers: {
    'User-Agent': 'Discord RSS Bot/1.0'
  }
});

// Slash command definition
const data = new SlashCommandBuilder()
  .setName('rss')
  .setDescription('Manage RSS feeds for monitoring')
  .addSubcommand(subcommand => 
    subcommand
      .setName('add')
      .setDescription('Add an RSS feed to monitor')
      .addStringOption(option => 
        option.setName('url')
          .setDescription('The RSS feed URL')
          .setRequired(true))
      .addChannelOption(option => 
        option.setName('channel')
          .setDescription('The channel to post updates to')
          .setRequired(true))
      .addIntegerOption(option => 
        option.setName('interval')
          .setDescription('Check interval in minutes (default: 30)')))
  .addSubcommand(subcommand => 
    subcommand
      .setName('remove')
      .setDescription('Remove an RSS feed')
      .addStringOption(option => 
        option.setName('url')
          .setDescription('The RSS feed URL to remove')
          .setRequired(true))
      .addChannelOption(option => 
        option.setName('channel')
          .setDescription('The channel the feed is posting to (optional)')))
  .addSubcommand(subcommand => 
    subcommand
      .setName('list')
      .setDescription('List all monitored RSS feeds'))
  .addSubcommand(subcommand => 
    subcommand
      .setName('check')
      .setDescription('Force check all RSS feeds now'));

// Handle slash command execution
async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;
  
  switch (subcommand) {
    case 'add':
      return handleAddRssSlash(interaction, guildId);
    case 'remove':
      return handleRemoveRssSlash(interaction, guildId);
    case 'list':
      return handleListRssSlash(interaction, guildId);
    case 'check':
      return handleCheckRssSlash(interaction);
  }
}

// Handle adding an RSS feed (slash command)
async function handleAddRssSlash(interaction, guildId) {
  await interaction.deferReply(); // This might take a while
  
  const url = interaction.options.getString('url');
  const channel = interaction.options.getChannel('channel');
  const channelId = channel.id;
  const checkInterval = interaction.options.getInteger('interval');
  
  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    return interaction.editReply('Invalid URL. Please provide a valid RSS feed URL.');
  }
  
  // Validate RSS feed
  try {
    await interaction.editReply('Validating RSS feed, please wait...');
    await parser.parseURL(url);
  } catch (error) {
    return interaction.editReply(`Failed to parse RSS feed: ${error.message}`);
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
    return interaction.editReply(`✅ RSS feed added. Updates will be posted to <#${channelId}> every ${interval} minutes.`);
  } else {
    return interaction.editReply(`❌ ${responseMessage || 'Failed to add RSS feed.'}`);
  }
}

// Handle removing an RSS feed (slash command)
async function handleRemoveRssSlash(interaction, guildId) {
  const url = interaction.options.getString('url');
  const channel = interaction.options.getChannel('channel');
  const channelId = channel ? channel.id : '%'; // If no channel specified, use wildcard
  
  // Remove RSS feed from database
  const { success, message: responseMessage } = await rssService.removeRssFeed(
    url, 
    channelId, 
    guildId
  );
  
  if (success) {
    return interaction.reply(`✅ RSS feed removed.`);
  } else {
    return interaction.reply(`❌ ${responseMessage || 'Failed to remove RSS feed.'}`);
  }
}

// Handle listing RSS feeds (slash command)
async function handleListRssSlash(interaction, guildId) {
  const { success, data: feeds, message: responseMessage } = await rssService.getRssFeeds(guildId);
  
  if (!success) {
    return interaction.reply(`❌ ${responseMessage || 'Failed to list RSS feeds.'}`);
  }
  
  if (!feeds || feeds.length === 0) {
    return interaction.reply('No RSS feeds configured for this server.');
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
  
  return interaction.reply({ embeds: [embed] });
}

// Handle checking RSS feeds (slash command)
async function handleCheckRssSlash(interaction) {
  await interaction.deferReply();
  
  try {
    await checkAllFeeds(interaction.client);
    return interaction.editReply('✅ RSS feeds checked successfully.');
  } catch (error) {
    console.error('Error checking RSS feeds:', error);
    return interaction.editReply(`❌ Error checking RSS feeds: ${error.message}`);
  }
}

// Handle the RSS command (legacy prefix command)
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

// Handle adding an RSS feed (legacy)
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

// Handle removing an RSS feed (legacy)
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

// Handle listing RSS feeds (legacy)
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

// Handle checking RSS feeds (legacy)
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
  data,
  execute,
  handleRssCommand
};
