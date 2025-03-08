const { EmbedBuilder } = require('discord.js');
const { keywordService } = require('./database');

// Process a message for keyword forwarding
async function processMessage(message, client) {
  // Ignore messages from bots
  if (message.author.bot) return;
  
  // Get guild ID
  const guildId = message.guild?.id;
  if (!guildId) return; // Skip DMs
  
  // Get all keywords for this guild
  const { success, data: keywords, message: errorMessage } = await keywordService.getKeywords(guildId);
  
  if (!success) {
    console.error('Failed to get keywords:', errorMessage);
    return;
  }
  
  // No keywords configured
  if (!keywords || keywords.length === 0) return;
  
  // Get message content in lowercase for case-insensitive matching
  const content = message.content.toLowerCase();
  
  // Find matching keywords
  const matches = keywords.filter(k => content.includes(k.keyword.toLowerCase()));
  
  // Process each match
  for (const match of matches) {
    try {
      // Skip if the message is already in the target channel
      if (message.channel.id === match.channel_id) continue;
      
      // Get the target channel
      const targetChannel = await client.channels.fetch(match.channel_id);
      if (!targetChannel) {
        console.error(`Target channel ${match.channel_id} not found for keyword ${match.keyword}`);
        continue;
      }
      
      // Forward the message based on the forwarding mode
      // Default to simple forwarding (just the content)
      await forwardMessage(message, targetChannel, match.keyword);
      
      // Log the forwarded message
      await keywordService.logForwardedMessage(
        message.id,
        message.channel.id,
        match.channel_id,
        match.keyword,
        guildId
      );
      
    } catch (error) {
      console.error(`Error forwarding message for keyword ${match.keyword}:`, error);
    }
  }
}

// Forward a message to the target channel
async function forwardMessage(message, targetChannel, keyword) {
  // Check if there are any attachments
  let files = [];
  if (message.attachments.size > 0) {
    files = Array.from(message.attachments.values());
  }
  
  // Forward just the message content
  await targetChannel.send({
    content: message.content,
    files: files
  });
}

// Create a Discord embed for a forwarded message (kept for reference)
function createForwardEmbed(message, keyword) {
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setAuthor({
      name: message.author.tag,
      iconURL: message.author.displayAvatarURL({ dynamic: true })
    })
    .setDescription(message.content)
    .addFields(
      { name: 'Keyword', value: keyword, inline: true },
      { name: 'Original Channel', value: `<#${message.channel.id}>`, inline: true },
      { name: 'Jump to Message', value: `[Click Here](${message.url})`, inline: true }
    )
    .setTimestamp(message.createdAt)
    .setFooter({ text: `Message ID: ${message.id}` });
  
  // Add attachments if any
  if (message.attachments.size > 0) {
    const attachment = message.attachments.first();
    
    // Check if it's an image
    if (attachment.contentType?.startsWith('image/')) {
      embed.setImage(attachment.url);
    } else {
      embed.addFields({
        name: 'Attachment',
        value: `[${attachment.name}](${attachment.url})`
      });
    }
  }
  
  return embed;
}

module.exports = {
  processMessage
};
