const { keywordService } = require('../services/database');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

// Slash command definition
const data = new SlashCommandBuilder()
  .setName('keyword')
  .setDescription('Manage keywords for message forwarding')
  .addSubcommand(subcommand => 
    subcommand
      .setName('add')
      .setDescription('Add a keyword to forward to a channel')
      .addStringOption(option => 
        option.setName('keyword')
          .setDescription('The keyword to monitor')
          .setRequired(true))
      .addChannelOption(option => 
        option.setName('channel')
          .setDescription('The channel to forward messages to')
          .setRequired(true)))
  .addSubcommand(subcommand => 
    subcommand
      .setName('remove')
      .setDescription('Remove a keyword-channel mapping')
      .addStringOption(option => 
        option.setName('keyword')
          .setDescription('The keyword to remove')
          .setRequired(true))
      .addChannelOption(option => 
        option.setName('channel')
          .setDescription('The channel to remove the keyword from')
          .setRequired(true)))
  .addSubcommand(subcommand => 
    subcommand
      .setName('list')
      .setDescription('List all keyword-channel mappings'));

// Handle slash command execution
async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;
  
  switch (subcommand) {
    case 'add':
      return handleAddKeywordSlash(interaction, guildId);
    case 'remove':
      return handleRemoveKeywordSlash(interaction, guildId);
    case 'list':
      return handleListKeywordsSlash(interaction, guildId);
  }
}

// Handle adding a keyword (slash command)
async function handleAddKeywordSlash(interaction, guildId) {
  const keyword = interaction.options.getString('keyword');
  const channel = interaction.options.getChannel('channel');
  const channelId = channel.id;
  
  // Add keyword to database
  const { success, message: responseMessage } = await keywordService.addKeyword(keyword, channelId, guildId);
  
  if (success) {
    return interaction.reply(`✅ Keyword \`${keyword}\` added. Messages containing this keyword will be forwarded to <#${channelId}>.`);
  } else {
    return interaction.reply(`❌ ${responseMessage || 'Failed to add keyword.'}`);
  }
}

// Handle removing a keyword (slash command)
async function handleRemoveKeywordSlash(interaction, guildId) {
  const keyword = interaction.options.getString('keyword');
  const channel = interaction.options.getChannel('channel');
  const channelId = channel.id;
  
  // Remove keyword from database
  const { success, message: responseMessage } = await keywordService.removeKeyword(keyword, channelId, guildId);
  
  if (success) {
    return interaction.reply(`✅ Keyword \`${keyword}\` removed from channel <#${channelId}>.`);
  } else {
    return interaction.reply(`❌ ${responseMessage || 'Failed to remove keyword.'}`);
  }
}

// Handle listing keywords (slash command)
async function handleListKeywordsSlash(interaction, guildId) {
  const { success, data: keywords, message: responseMessage } = await keywordService.getKeywords(guildId);
  
  if (!success) {
    return interaction.reply(`❌ ${responseMessage || 'Failed to list keywords.'}`);
  }
  
  if (!keywords || keywords.length === 0) {
    return interaction.reply('No keywords configured for this server.');
  }
  
  // Group keywords by channel
  const keywordsByChannel = {};
  keywords.forEach(k => {
    if (!keywordsByChannel[k.channel_id]) {
      keywordsByChannel[k.channel_id] = [];
    }
    keywordsByChannel[k.channel_id].push(k.keyword);
  });
  
  // Create embed
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Keyword Forwarding Configuration')
    .setDescription('Messages containing these keywords will be forwarded to the specified channels.')
    .setTimestamp();
  
  // Add fields for each channel
  for (const [channelId, channelKeywords] of Object.entries(keywordsByChannel)) {
    embed.addFields({
      name: `Channel <#${channelId}>`,
      value: channelKeywords.map(k => `\`${k}\``).join(', ')
    });
  }
  
  return interaction.reply({ embeds: [embed] });
}

// Handle the keyword command (legacy prefix command)
async function handleKeywordCommand(message, args) {
  const subcommand = args[0]?.toLowerCase();
  const guildId = message.guild.id;
  
  if (!subcommand) {
    return message.reply('Usage: `!keyword add|remove|list <keyword> <channelId>`');
  }
  
  switch (subcommand) {
    case 'add':
      return handleAddKeyword(message, args.slice(1), guildId);
    case 'remove':
      return handleRemoveKeyword(message, args.slice(1), guildId);
    case 'list':
      return handleListKeywords(message, guildId);
    default:
      return message.reply('Unknown subcommand. Use `add`, `remove`, or `list`.');
  }
}

// Handle adding a keyword (legacy)
async function handleAddKeyword(message, args, guildId) {
  const keyword = args[0];
  const channelId = args[1]?.replace(/[<#>]/g, ''); // Remove <#> if present
  
  if (!keyword || !channelId) {
    return message.reply('Usage: `!keyword add <keyword> <channelId>`');
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
  
  // Add keyword to database
  const { success, message: responseMessage } = await keywordService.addKeyword(keyword, channelId, guildId);
  
  if (success) {
    return message.reply(`✅ Keyword \`${keyword}\` added. Messages containing this keyword will be forwarded to <#${channelId}>.`);
  } else {
    return message.reply(`❌ ${responseMessage || 'Failed to add keyword.'}`);
  }
}

// Handle removing a keyword (legacy)
async function handleRemoveKeyword(message, args, guildId) {
  const keyword = args[0];
  const channelId = args[1]?.replace(/[<#>]/g, ''); // Remove <#> if present
  
  if (!keyword || !channelId) {
    return message.reply('Usage: `!keyword remove <keyword> <channelId>`');
  }
  
  // Remove keyword from database
  const { success, message: responseMessage } = await keywordService.removeKeyword(keyword, channelId, guildId);
  
  if (success) {
    return message.reply(`✅ Keyword \`${keyword}\` removed from channel <#${channelId}>.`);
  } else {
    return message.reply(`❌ ${responseMessage || 'Failed to remove keyword.'}`);
  }
}

// Handle listing keywords (legacy)
async function handleListKeywords(message, guildId) {
  const { success, data: keywords, message: responseMessage } = await keywordService.getKeywords(guildId);
  
  if (!success) {
    return message.reply(`❌ ${responseMessage || 'Failed to list keywords.'}`);
  }
  
  if (!keywords || keywords.length === 0) {
    return message.reply('No keywords configured for this server.');
  }
  
  // Group keywords by channel
  const keywordsByChannel = {};
  keywords.forEach(k => {
    if (!keywordsByChannel[k.channel_id]) {
      keywordsByChannel[k.channel_id] = [];
    }
    keywordsByChannel[k.channel_id].push(k.keyword);
  });
  
  // Create embed
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Keyword Forwarding Configuration')
    .setDescription('Messages containing these keywords will be forwarded to the specified channels.')
    .setTimestamp();
  
  // Add fields for each channel
  for (const [channelId, channelKeywords] of Object.entries(keywordsByChannel)) {
    embed.addFields({
      name: `Channel <#${channelId}>`,
      value: channelKeywords.map(k => `\`${k}\``).join(', ')
    });
  }
  
  return message.reply({ embeds: [embed] });
}

module.exports = {
  data,
  execute,
  handleKeywordCommand
};
