
// install the plugin
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import * as mineflayer from 'mineflayer'
import * as radarPlugin from 'mineflayer-radar'
import * as navigatePlugin from 'mineflayer-navigate'
import * as blockFinderPlugin from 'mineflayer-blockfinder'
import * as bloodhoundPlugin from 'mineflayer-bloodhound'
import * as io from 'socket.io-client'
import { Brain } from './Brain'
import { TickEvent } from './TickEvent'
class App {
    protected socket:SocketIOClient.Socket = null;
    protected bot:any = null;
    protected brain:Brain = null;
    protected isSpawned:boolean = false;
    protected identity:any = null;
    protected _tickEvents:Array<TickEvent> = [];
    constructor () {


    }
    get tickEvents():Array<TickEvent>{
        return this._tickEvents;
    }
    run(){

        this.setupSocket();

    }
    setupSocket(){
        this.socket = io('http://localhost:3000');
        console.log("Setting Up Socket");
        this.socket.on('client_hello_response', (identity) => {
           this.identity = identity;
            this.setupBrain()
        });
        this.socket.emit('client_hello', {});
    }


    setupBrain(){
        request(
            {
                url:'http://localhost:3000/brains/' + this.identity._id,
                json: true
            },
            (err, response, brain)=>{
                if(err){
                    throw err;
                }
                //Load file and parse JSON
                //let fileBody = fs.readFileSync(path.resolve(__dirname,'..', 'brain1.json')).toString();
                let rawBrainNodes = JSON.parse(brain.brain);
                //Iterate through and find the outputs
                this.brain = new Brain({
                    rawBrainNodes: rawBrainNodes,
                    app: this
                });
                console.log("Brain alive with " + Object.keys(this.brain.nodes).length + " nodes");
                this.setupBot();
            }
        )

    }

    setupBot(){
        this.bot = mineflayer.createBot({
            host: "127.0.0.1", // optional
            //port: 3001,       // optional
            username: this.identity.name + Math.floor(Math.random() * 10),
            /*    username: "email@example.com", // email and password are required only for
             password: "12345678",          // online-mode=true servers*/
            verbose: true,
            //version: "1.12.2",
            checkTimeoutInterval: 30*1000
        });
        radarPlugin(mineflayer)(this.bot, {port:3002});
        navigatePlugin(mineflayer)(this.bot);
        bloodhoundPlugin(mineflayer)(this.bot);
        blockFinderPlugin(mineflayer)(this.bot);

        this.bot.once('connect', this.onConnect)
        this.bot.once('error', this.onError)
        this.bot.once('login', this.onLogin)
        this.bot.on("death", (e)=>{
            console.log("Death", e);
            this.isSpawned = false;
        })
        this.bot.on("spawn", (e)=>{
            this.isSpawned = true;
            setInterval(()=>{
                this.brain.processTick();
                this._tickEvents = [];
            }, 500)
        })
        this.setupEventListenter('health');
        this.setupEventListenter('chat');
        this.setupEventListenter('entityUpdate');
        this.setupEventListenter('onCorrelateAttack');
        //TODO Move this to a plugin


        this.bot.visiblePosition =  (a, b) => {
            let v = b.minus(a)
            const t = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
            v = v.scaled(1 / t)
            v = v.scaled(1 / 5)
            const u = t * 5
            let na
            for (let i = 1; i < u; i++) {
                na = a.plus(v)
                // check that blocks don't inhabit the same position
                if (!na.floored().equals(a.floored())) {
                    // check block is not transparent

                    const block = this.bot.blockAt(na);
                    if (block !== null && block.boundingBox !== 'empty'){
                        return false;
                    }
                }
                a = na
            }
            return true
        }

        this.bot.canSeePosition = (position)=>{
            position = position.position || position;
            // this emits a ray from the center of the bots body to the block
            if (this.bot.visiblePosition(this.bot.entity.position.offset(0, this.bot.entity.height * 0.5, 0), position)) {
                return true
            }
            return false
        }
        this.bot.on('diggingCompleted', ()=>{
            this.bot._currentlyDigging = null;
        })
        this.bot.on('diggingAborted', ()=>{
            this.bot._currentlyDigging = null;
        })
        this.bot.smartDig = (block, cb) => {
            if(this.bot._currentlyDigging){
               //TODO: Cross Check
                return;
            }
            this.bot._currentlyDigging = block;
            this.bot.chat("I am digging");
            this.bot.dig(this.bot._currentlyDigging, cb);

        }

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
    setupEventListenter(eventType){
        let _this = this;
        this.bot.on(eventType, function(e){
            if(eventType == 'chat'){
                console.log("Chattin");
            }
            _this._tickEvents.push(new TickEvent({
                type: eventType,
                data:Array.from(arguments)
            }))
        })
    }




}

export default new App().run()