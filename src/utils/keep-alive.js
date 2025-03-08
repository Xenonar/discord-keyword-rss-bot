const express = require('express');
const server = express();

// Simple ping endpoint
server.get('/', (req, res) => {
  res.send('Discord bot is running!');
});

// Keep the bot alive by creating a simple HTTP server
function keepAlive() {
  server.listen(3000, () => {
    console.log('Keep-alive server is running on port 3000');
  });
}

module.exports = { keepAlive };
