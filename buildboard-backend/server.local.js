const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./config/socket');

const server = http.createServer(app);
initializeSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`BuildBoard+ Server running on port ${PORT}`);
});
