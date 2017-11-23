const mineflayer = require('mineflayer');
const radarPlugin = require('mineflayer-radar')(mineflayer);
const navigatePlugin = require('mineflayer-navigate')(mineflayer);
// install the plugin

var bot = mineflayer.createBot({
    host: "52.204.181.120", // optional
    port: 3001,       // optional
/*    username: "email@example.com", // email and password are required only for
    password: "12345678",          // online-mode=true servers*/
});
radarPlugin(bot, {port:3002});
navigatePlugin(bot);
bot.on('chat', function(username, message) {
    if (username === bot.username) return;
    bot.chat(message);
});
bot.once('connect', () => console.log('connected'))
bot.once('error', (err) => console.error(err.message))
bot.once('login', () => console.log('logged in'))
bot.on("death", (e)=>{
console.log("Death", e);
})
bot.on("spawn", (e)=>{
    console.log("spawn", e);
})
bot.on("health", (e)=>{
    console.log("health", e);
})
let target = null;
bot.on("entityUpdate", (e)=>{
    if(!target){
        target = Object.keys(bot.entities)[0];
        try {
            let entity = bot.entities[target]
            let position = bot.entities[target].position;
            bot.navigate.to(position);
            console.log("Following:", entity);
        }catch(e){
            target = null;
        }
    }

   // console.log("entityUpdate", e);
})

bot.navigate.on('pathFound', function (path) {
    console.log/*bot.chat*/("found path. I can get there in " + path.length + " moves.");
});
bot.navigate.on('cannotFind', function (closestPath) {
    console.log/*bot.chat*/("unable to find path. getting as close as possible");
    bot.navigate.walk(closestPath);
});
bot.navigate.on('arrived', function () {
    console.log/*bot.chat*/("I have arrived");
});
bot.navigate.on('interrupted', function() {
    console.log/*bot.chat*/("stopping");
});
