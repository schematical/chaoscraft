
// install the plugin
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import * as mineflayer from 'mineflayer'
import * as radarPlugin from 'mineflayer-radar'
import * as navigatePlugin from 'mineflayer-navigate'
import * as blockFinderPlugin from 'mineflayer-blockfinder'
import * as bloodhoundPlugin from 'mineflayer-bloodhound'
import * as config from 'config';

import { SocketManager } from './SocketManager'

import { Brain } from './brain/Brain'
import { TickEvent } from './TickEvent'
class App {
    protected processTickInterval:any = null;
    protected daysAlive:number = 0;
    protected bornDate:Date = null;
    protected startPosition:any = null;
    protected _socket:SocketManager = null;
    protected bot:any = null;
    protected brain:Brain = null;
    protected isSpawned:boolean = false;
    protected identity:any = null;
    protected _tickEvents:Array<TickEvent> = [];
    constructor () {
        console.log("Starting");

    }
    get tickEvents():Array<TickEvent>{
        return this._tickEvents;
    }
    get socket():SocketManager{
        return this._socket;
    }
    run(){

        this.setupSocket();

    }
    setupSocket(){
        this._socket = new SocketManager({
            app:this
        })
    }


    setupBrain(){
        return request(
            {
                url: config.get('server.host') + '/bots/' + this.identity.username + '/brain',
                json: true
            },
            (err, response, brain)=>{
                if(err){
                    throw err;
                }
                //Load file and parse JSON
                //let fileBody = fs.readFileSync(path.resolve(__dirname,'..', 'brain1.json')).toString();
                let rawBrainNodes = brain;//JSON.parse(brain.brain);
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
            host: config.get('minecraft.host'),//"127.0.0.1", // optional
            //port: 3001,       // optional
            username: this.identity.username,
            //password: "12345678",          // online-mode=true servers*/
            verbose: true,
            //version: "1.12.2",
            checkTimeoutInterval: 30*1000
        });
        //radarPlugin(mineflayer)(this.bot, {port:3002});
        navigatePlugin(mineflayer)(this.bot);
        bloodhoundPlugin(mineflayer)(this.bot);
        blockFinderPlugin(mineflayer)(this.bot);

        this.bot.once('connect', this.onConnect)
        this.bot.once('error', (err)=>{ this.onError(err) });
        this.bot.once('login', this.onLogin)
        this.bot.on('disconnect', (e)=>{
            console.log("DISCONNECTED FROM MINECRAFT");
            this. setupBot();
        })
        this.bot.on('kick_disconnect', (e)=>{

            console.log("KICK DISCONNECTED FROM MINECRAFT");
            this. setupBot();
        })
        this.bot.on("death", (e)=>{
            console.log("Death", e);
            this.isSpawned = false;
            return this.socket.emit('client_death', {
                username: this.identity.username,
                event:e
            });
        })
        this.bot.on("spawn", (e)=>{
            this.isSpawned = true;
            this.bornDate = new Date();
            this.daysAlive = 0;
            this.startPosition = this.bot.entity.position;
            this.processTickInterval = setInterval(()=>{
                this.brain.processTick();
                this._tickEvents = [];
                let duration = Math.floor((new Date().getTime() - this.bornDate.getTime()) / 1000);
                if(duration > 60){
                    if(this.brain.firedOutpuCount == 0){
                        this.bot.chat("I have failed to do anything in 30 seconds, jumping  to my doom");
                        this.bot.quit();
                        clearTimeout(this.processTickInterval);
                        return this.socket.emit('client_not_firing', this.identity)
                    }
                }
                let nextDayTime = this.daysAlive * (60 * 20);
                if(duration > nextDayTime){
                    this.daysAlive += 1;
                    //It has been one day
                    let distance = this.startPosition.distanceTo(this.bot.entity.position);
                    return this.socket.emit('client_day_passed', {
                        username: this.identity.username,
                        daysAlive: this.daysAlive,
                        distanceTraveled: distance,

                    });
                }
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
            return false;
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
       console.error('ERROR: ', err.message)
        this.bot.quit();
        this.setupBot();
    }
    onLogin(){
        console.log("Logged In!!")
    }
    setupEventListenter(eventType){
        let _this = this;
        this.bot.on(eventType, function(e){
            /*if(eventType == 'chat'){
                console.log("Chattin");
            }*/
            _this._tickEvents.push(new TickEvent({
                type: eventType,
                data:Array.from(arguments)
            }))
        })
    }




}

export default new App().run()