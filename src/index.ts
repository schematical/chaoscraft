
/*const radarPlugin = require('mineflayer-radar')(mineflayer);
const navigatePlugin = require('mineflayer-navigate')(mineflayer);
const blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
const bloodhoundPlugin = require('mineflayer-bloodhound')(mineflayer);*/
// install the plugin
import * as mineflayer from 'mineflayer'
import * as radarPlugin from 'mineflayer-radar'
import * as navigatePlugin from 'mineflayer-navigate'
import * as blockFinderPlugin from 'mineflayer-blockfinder'
import * as bloodhoundPlugin from 'mineflayer-bloodhound'
import * as OutputNodeBase from './nodes/NodeBase'
class App {
    protected bot;
    constructor () {


    }

    run(){
        this.bot = mineflayer.createBot({
            host: "127.0.0.1", // optional
            //port: 3001,       // optional
            /*    username: "email@example.com", // email and password are required only for
             password: "12345678",          // online-mode=true servers*/
        });
        radarPlugin(this.bot, {port:3002});
        navigatePlugin(this.bot);
        bloodhoundPlugin(this.bot);
        blockFinderPlugin(this.bot);

        this.bot.once('connect', this.onConnect)
        this.bot.once('error', this.onError)
        this.bot.once('login', this.onLogin)
        this.bot.on("death", (e)=>{
            console.log("Death", e);
        })
        this.bot.on("spawn", (e)=>{
            console.log("spawn", e);
        })
        this.bot.on("health", (e, b)=>{
            console.log("health", e, b);
        })
    }
    onConnect(){
        console.log("Connected");
    }
    onError(err){
       console.error(err.message)
    }
    onLogin(){
        console.log("Logged In!!")
    }

    parseBrainJSON(){
        //Load file and parse JSON

        //Iterate through and find the outputs

    }


}

export default new App().run()