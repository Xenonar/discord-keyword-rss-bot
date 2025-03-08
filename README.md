# Discord Keyword & RSS Bot

A Discord bot that:

1. Forwards messages based on keywords to specific channels
2. Posts updates from RSS feeds to designated channels

## Features

### Keyword Forwarding

- Configure keywords to trigger message forwarding
- Forward messages to specific channels based on keyword matches
- Support for multiple keywords and target channels
- Case-insensitive matching

### RSS Feed Monitoring

- Monitor multiple RSS feeds
- Post new articles to designated channels
- Configurable check intervals
- Avoid duplicate posts

### Modern Command Interface

- Support for Discord slash commands
- Traditional prefix commands for backward compatibility
- Interactive help system

## Setup

### Prerequisites

- Node.js (v16.9.0 or higher)
- Discord Bot Token
- Discord Application ID (for slash commands)
- Supabase Account (free tier)

### Installation

1. Clone this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

4. Set up Supabase database (see below)
5. Deploy slash commands:

   ```bash
   npm run deploy-commands
   ```

6. Start the bot:

   ```bash
   npm start
   ```

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL setup script in `supabase/setup.sql`
3. Copy your Supabase URL and anon key to the `.env` file

## Deployment on Replit

This bot is configured to run on Replit, a free hosting platform for your Discord bot. Follow these steps to deploy:

1. **Create a Replit Account**:
   - Go to [Replit.com](https://replit.com/) and sign up for an account

2. **Create a New Repl**:
   - Click the "+" button to create a new repl
   - Choose "Import from GitHub"
   - Paste your GitHub repository URL (after pushing your code to GitHub)
   - Or choose "Node.js" as the template and upload your files manually

3. **Set Up Environment Variables**:
   - In your Repl, click on the "Secrets" tab (lock icon in the sidebar)
   - Add the following secrets:
     - `DISCORD_TOKEN`: Your Discord bot token
     - `CLIENT_ID`: Your Discord application ID
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_KEY`: Your Supabase anon key
     - `PREFIX`: Command prefix (default is `!`)
     - `DEFAULT_RSS_CHECK_INTERVAL`: Default interval for checking RSS feeds

4. **Enable "Always On"**:
   - Click on your profile picture in the top right
   - Go to "My Repls"
   - Find your bot repl
   - Toggle the "Always On" switch to keep your bot running 24/7
   - Note: This feature might require a Replit subscription

5. **Deploy Slash Commands**:
   - Run the following command to register slash commands with Discord:

     ```bash
     npm run deploy-commands
     ```

6. **Run Your Bot**:
   - Click the "Run" button at the top
   - Your bot should start and connect to Discord

7. **Keep Your Bot Alive (Alternative Method)**:
   - If you don't have "Always On" access, you can use a service like [UptimeRobot](https://uptimerobot.com/)
   - Create a free account on UptimeRobot
   - Add a new monitor of type "HTTP(s)"
   - Set the URL to your Replit app URL (found in the webview tab when your app is running)
   - Set the monitoring interval to 5 minutes
   - This will ping your bot regularly to prevent it from sleeping

### Files Added for Replit Deployment

- `.replit`: Configuration file for Replit
- `replit.nix`: Nix environment configuration
- `src/utils/keep-alive.js`: Express server to keep the bot awake

## Usage

### Slash Commands

- `/keyword add` - Add a keyword to forward to a channel
- `/keyword remove` - Remove a keyword-channel mapping
- `/keyword list` - List all keyword-channel mappings
- `/rss add` - Add an RSS feed to monitor
- `/rss remove` - Remove an RSS feed
- `/rss list` - List all monitored RSS feeds
- `/rss check` - Force check all RSS feeds now
- `/help` - Show help information about all commands

### Legacy Prefix Commands

- `!keyword add <keyword> <channelId>` - Add a keyword to forward to a channel
- `!keyword remove <keyword> <channelId>` - Remove a keyword-channel mapping
- `!keyword list` - List all keyword-channel mappings
- `!rss add <url> <channelId> [checkInterval]` - Add an RSS feed to monitor
- `!rss remove <url>` - Remove an RSS feed
- `!rss list` - List all monitored RSS feeds
- `!rss check` - Force check all RSS feeds now
- `!help` - Show help information about all commands

## Demo Mode

If you want to see how the bot works without setting up Discord and Supabase credentials, you can run the demo mode:

```bash
npm run demo
```

This will show examples of:
- Keyword forwarding with sample messages
- RSS feed processing with sample feeds
- Command usage examples

## Testing the Database Connection

To test your Supabase connection:

```bash
npm run test-db
```

This will verify that your Supabase credentials are correct and the required tables exist.

## License

MIT
