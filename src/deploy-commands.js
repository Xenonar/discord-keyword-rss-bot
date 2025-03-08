const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check for required environment variables
const { DISCORD_TOKEN, CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || DISCORD_TOKEN === 'your_discord_bot_token_here') {
  console.error('⚠️ DISCORD_TOKEN not found in .env file or is using the default value');
  console.error('Please add your Discord bot token to the .env file');
  process.exit(1);
}

if (!CLIENT_ID || CLIENT_ID === 'your_discord_application_id_here') {
  console.error('⚠️ CLIENT_ID not found in .env file or is using the default value');
  console.error('Please add your Discord application ID to the .env file');
  process.exit(1);
}

const commands = [];
// Grab all the command files from the commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`Added command: ${command.data.name}`);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(DISCORD_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in all guilds
    const data = await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // Catch and log any errors
    console.error(error);
    
    if (error.message && error.message.includes('401: Unauthorized')) {
      console.log('\n⚠️ AUTHENTICATION ERROR');
      console.log('Please check that your Discord bot token and client ID are correct in the .env file.');
    } else if (error.message && error.message.includes('Missing Access')) {
      console.log('\n⚠️ PERMISSIONS ERROR');
      console.log('Your bot does not have the necessary permissions to register slash commands.');
      console.log('Make sure you invited the bot with the "applications.commands" scope.');
    }
  }
})();