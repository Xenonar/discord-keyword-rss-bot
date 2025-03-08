const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

// Slash command definition
const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Shows information about bot commands');

// Handle slash command execution
async function execute(interaction) {
  const embed = createHelpEmbed(interaction.client);
  return interaction.reply({ embeds: [embed] });
}

// Handle the help command (legacy prefix command)
async function handleHelpCommand(message) {
  const embed = createHelpEmbed(message.client);
  return message.reply({ embeds: [embed] });
}

// Create help embed for both slash and prefix commands
function createHelpEmbed(client) {
  const prefix = process.env.PREFIX || '!';
  
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Discord Keyword & RSS Bot - Help')
    .setDescription('This bot forwards messages based on keywords and posts updates from RSS feeds.')
    .setTimestamp()
    .setFooter({ text: 'Developed by Artunik Co., Ltd.' });
  
  // Keyword commands
  embed.addFields({
    name: '📝 Keyword Commands',
    value: [
      '**Slash Commands:**',
      '`/keyword add` - Add a keyword to forward to a channel',
      '`/keyword remove` - Remove a keyword-channel mapping',
      '`/keyword list` - List all keyword-channel mappings',
      '',
      '**Prefix Commands:**',
      `\`${prefix}keyword add <keyword> <channelId>\` - Add a keyword to forward to a channel`,
      `\`${prefix}keyword remove <keyword> <channelId>\` - Remove a keyword-channel mapping`,
      `\`${prefix}keyword list\` - List all keyword-channel mappings`
    ].join('\n')
  });
  
  // RSS commands
  embed.addFields({
    name: '📰 RSS Commands',
    value: [
      '**Slash Commands:**',
      '`/rss add` - Add an RSS feed to monitor',
      '`/rss remove` - Remove an RSS feed',
      '`/rss list` - List all monitored RSS feeds',
      '`/rss check` - Force check all RSS feeds now',
      '',
      '**Prefix Commands:**',
      `\`${prefix}rss add <url> <channelId> [checkInterval]\` - Add an RSS feed to monitor`,
      `\`${prefix}rss remove <url> [channelId]\` - Remove an RSS feed`,
      `\`${prefix}rss list\` - List all monitored RSS feeds`,
      `\`${prefix}rss check\` - Force check all RSS feeds now`
    ].join('\n')
  });
  
  // Help command
  embed.addFields({
    name: '❓ Help Command',
    value: [
      '**Slash Command:**',
      '`/help` - Show this help message',
      '',
      '**Prefix Command:**',
      `\`${prefix}help\` - Show this help message`
    ].join('\n')
  });
  
  return embed;
}

module.exports = {
  data,
  execute,
  handleHelpCommand
};
