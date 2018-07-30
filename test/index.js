var mineflayer = require('mineflayer');
var bot = mineflayer.createBot({
    host: "24.240.32.101", // optional
    port: 25565,       // optional
    username: "test", // email and password are required only for
    //password: "12345678",          // online-mode=true servers
});
bot.on('chat', function(username, message) {
    if (username === bot.username) return;
    bot.chat(message);
});