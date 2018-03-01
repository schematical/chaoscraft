
// install the plugin
import * as fs from 'fs';
import * as path from 'path';
import * as mineflayer from 'mineflayer'
import * as radarPlugin from 'mineflayer-radar'
import * as navigatePlugin from 'mineflayer-navigate'
import * as blockFinderPlugin from 'mineflayer-blockfinder'
import * as bloodhoundPlugin from 'mineflayer-bloodhound'
import {Brain} from './Brain'
class App {
    protected bot:any = null;
    protected brain:Brain = null;
    constructor () {


    }

    run(){

        this.setupBrain();
        this.setupBot();
    }


    setupBrain(){

        //Load file and parse JSON
        let fileBody = fs.readFileSync(path.resolve(__dirname,'..', 'brain1.json')).toString();
        let rawBrainNodes = JSON.parse(fileBody);
        //Iterate through and find the outputs
        this.brain = new Brain({
            rawBrainNodes: rawBrainNodes,
            app: this
        });
        console.log("Brain alive with " + Object.keys(this.brain.nodes).length + " nodes");

    }

    setupBot(){
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




}

export default new App().run()