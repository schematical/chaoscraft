const mineflayer = require('mineflayer');
const radarPlugin = require('mineflayer-radar')(mineflayer);
const navigatePlugin = require('mineflayer-navigate')(mineflayer);
// install the plugin

var bot = mineflayer.createBot({
    host: "127.0.0.1", // optional
    //port: 3001,       // optional
/*    username: "email@example.com", // email and password are required only for
    password: "12345678",          // online-mode=true servers*/
});
radarPlugin(bot, {port:3002});
navigatePlugin(bot);
bot.navigate.blocksToAvoid[132] = true; // avoid tripwire
bot.navigate.blocksToAvoid[59] = false; // ok to trample crops
bot.on('chat', function(username, message) {
    // navigate to whoever talks
    if (username === bot.username) return;
    var target = bot.players[username].entity;
   switch(message) {
       case('come'):
           bot.navigate.to(target.position);
       break;
       case('stop'):
           bot.navigate.stop();
       break;
       case('block'):
           var stoneBlock=new Block(1,1,0);
           let results = bot.findBlock({
               matching:stoneBlock,
               maxDistance: 20
           })
           console.log("results", results);
   }
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
bot.on("health", (e, b)=>{
    console.log("health", e, b);
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
    bot.chat("found path. I can get there in " + path.length + " moves.");
});
bot.navigate.on('cannotFind', function (closestPath) {
    bot.chat("unable to find path. getting as close as possible");
    bot.navigate.walk(closestPath);
});
bot.navigate.on('arrived', function () {
    bot.chat("I have arrived");
});
bot.navigate.on('interrupted', function() {
    bot.chat("stopping");
});
