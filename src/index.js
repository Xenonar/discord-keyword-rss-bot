const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
const cron = require('node-cron');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { processMessage } = require('./services/keyword');
const { checkAllFeeds } = require('./services/rss');
const { handleKeywordCommand } = require('./commands/keyword');
const { handleRssCommand } = require('./commands/rss');
const { handleHelpCommand } = require('./commands/help');
const { keepAlive } = require('./utils/keep-alive');

// Command prefix
const PREFIX = process.env.PREFIX || '!';

// Check if Discord token is provided
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'your_discord_bot_token_here') {
  console.log('⚠️ DISCORD_TOKEN not found in .env file or is using the default value');
  console.log('This is a demonstration mode only. The bot will not connect to Discord.');
  console.log('To run the bot with Discord, please add your bot token to the .env file.');
  
  // Show sample commands that would be available
  console.log('\nAvailable commands when properly configured:');
  console.log(`${PREFIX}keyword add <keyword> <channelId> - Add a keyword to forward to a channel`);
  console.log(`${PREFIX}keyword remove <keyword> <channelId> - Remove a keyword-channel mapping`);
  console.log(`${PREFIX}keyword list - List all keyword-channel mappings`);
  console.log(`${PREFIX}rss add <url> <channelId> [checkInterval] - Add an RSS feed to monitor`);
  console.log(`${PREFIX}rss remove <url> - Remove an RSS feed`);
  console.log(`${PREFIX}rss list - List all monitored RSS feeds`);
  console.log(`${PREFIX}rss check - Force check all RSS feeds now`);
  console.log(`${PREFIX}help - Show this help message`);
  console.log(`\nSlash commands are also available when the bot is properly configured.`);
  
  // Exit with success code since this is just a demo
  process.exit(0);
}

// Start the keep-alive server for Replit
keepAlive();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// Create a collection for slash commands
client.commands = new Collection();

// Load all command modules
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Set up cron job to check RSS feeds every minute
  cron.schedule('* * * * *', async () => {
    try {
      await checkAllFeeds(client);
    } catch (error) {
      console.error('Error in RSS check cron job:', error);
    }
  });
});

// Handle interaction events (slash commands)
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`);
    console.error(error);
    
    // Reply with error if the interaction hasn't been replied to yet
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

// Handle messages (prefix commands)
client.on(Events.MessageCreate, async (message) => {
  try {
    // Ignore messages from bots
    if (message.author.bot) return;
    
    // Handle commands
    if (message.content.startsWith(PREFIX)) {
      const args = message.content.slice(PREFIX.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();
      
      switch (command) {
        case 'keyword':
          await handleKeywordCommand(message, args);
          break;
        case 'rss':
          await handleRssCommand(message, args);
          break;
        case 'help':
          await handleHelpCommand(message);
          break;
      }
      
      return;
    }
    
    // Process message for keyword forwarding
    await processMessage(message, client);
    
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Failed to login to Discord:', error);
  
  if (error.message && error.message.includes('disallowed intents')) {
    console.log('\n⚠️ PRIVILEGED INTENTS ERROR');
    console.log('You need to enable the required intents in the Discord Developer Portal:');
    console.log('1. Go to https://discord.com/developers/applications');
    console.log('2. Select your bot application');
    console.log('3. Go to the "Bot" tab');
    console.log('4. Scroll down to "Privileged Gateway Intents"');
    console.log('5. Enable "SERVER MEMBERS INTENT" and "MESSAGE CONTENT INTENT"');
    console.log('6. Save your changes and restart the bot');
  } else {
    console.log('\nPlease check that your Discord bot token is correct in the .env file.');
  }
  
  process.exit(1);
});
