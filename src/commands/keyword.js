const { keywordService } = require('../services/database');
const { EmbedBuilder } = require('discord.js');

// Handle the keyword command
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

// Handle adding a keyword
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

// Handle removing a keyword
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

// Handle listing keywords
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
  handleKeywordCommand
};
