console.log("AAAIIXXX");
// install the plugin
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import * as mineflayer from 'mineflayer'
import * as radarPlugin from 'mineflayer-radar'
import * as navigatePlugin from 'mineflayer-navigate'
import * as blockFinderPlugin from 'mineflayer-blockfinder'
import * as bloodhoundPlugin from 'mineflayer-bloodhound'
import * as Vec3 from 'vec3'
import * as config from 'config';

import { SocketManager } from './SocketManager'

import { Brain } from './brain/Brain'
import { TickEvent } from './TickEvent'
class App {
    protected tickCount:number = 0;
    protected autoReconnect:boolean = true;
    protected settingUp:boolean = false;
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
    protected connectionCheckInterval = null;
    protected connectionAttemptStartDate = null;
    constructor () {
        console.log("Starting");
        this.connectionCheckInterval = setInterval(this.connectionCheck.bind(this), 30 * 1000);

    }
    connectionCheck(){
        if(!this.identity){
            //Waiting on our socket server
            return false;
        }
        if(this.isSpawned){
            return false;
        }

        let connectionTimeInSeconds =(this.connectionAttemptStartDate.getTime() - new Date().getTime())/ 1000;
        if(connectionTimeInSeconds < 30 * 1000){
            return false; //It has only been less that 30 seconds
        }
        console.log("Starting to reconnect - connectionTimeInSeconds:", connectionTimeInSeconds)
        this.end();
        setTimeout(()=>{
            this.setupBot();
        }, 1000)


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
                this.bornDate = new Date();
                this.daysAlive = 0;
                this.tickCount = 0;
                console.log(this.identity.username + " alive with " + Object.keys(this.brain.nodes).length + " nodes");
                this.setupBot();
            }
        )

    }

    setupBot(){
        this.connectionAttemptStartDate = new Date();
        this.settingUp = true;
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

        this.bot.once('connect', ()=>{
            this.isSpawned = false;

            console.log(this.identity.username +  " - Connected!");
        });
        this.bot.once('error', (err)=>{
            console.error(this.identity.username + ' - ERROR: ', err.message)
            this.end();
        });
        this.bot.once('login', ()=>{
            console.log(this.identity.username +  " - Logged In ");

        });
        this.bot.once('end', (status)=>{
            this.isSpawned = false;
            console.log(this.identity.username +  " END(DISCONNECTED) FROM MINECRAFT: ", status);
            this.end();
            /*if(this.settingUp){
                //We are already setting up, just chill
                return false;
            }
            if(!this.autoReconnect){
                return false;
            }*/

        })
        this.bot.once('kicked', (reason)=>{
            try{
                reason = JSON.parse(reason);
            }catch(e){
                console.error("Error parsing KICKED message:", reason);
            }
            console.log(this.identity.username +  " KICKED FROM MINECRAFT: ", reason.translate);
            switch(reason.translate){
                case('multiplayer.disconnect.duplicate_login'):
                    //Kill this thing
                    this.end();
                    return this.socket.emit('client_request_new_brain', {
                        username: this.identity.username
                    })
                case('disconnect.timeout'):
                    //Do nothing

            }

            //this.end();
        })
        this.bot.once('disconnect', (e)=>{

            console.log(this.identity.username +  " DISCONNECTED FROM MINECRAFT");
            this.end();
        })

        this.bot.once("death", (e)=>{
            console.log("Death", e);
            return this.socket.emit('client_death', {
                username: this.identity.username,
                event:e
            });
        })
        this.bot.once("spawn", (e)=>{
            console.log(this.identity.username + " Spawned");
            this.settingUp = false;
            setTimeout(()=>{
                if(!this.bot || !this.bot.entity || !this.bot.entity.position){
                   console.error(this.identity.username +  " No position/entity data after a few seconds after spawn ");
                   return this.end();
                }

                this.startPosition = new Vec3({
                    x:this.bot.entity.position.x,
                    y:this.bot.entity.position.y,
                    z:this.bot.entity.position.z
                });

                console.log(this.identity.username +  " Position:", this.bot.entity.position.x, this.bot.entity.position.y, this.bot.entity.position.z);
                this.isSpawned = true;
            },10000)



            this.processTickInterval = setInterval(()=>{

                if(!this.brain.app.bot ||!this.brain.app.bot.entity){
                    return console.error("No `this.brain.app.bot.entity`, skipping `processTick`");
                }
                this.tickCount += 1;
                this.brain.processTick();
                this._tickEvents = [];
                //let duration = Math.floor((new Date().getTime() - this.bornDate.getTime()) / 1000);
                //console.log("TICK:", this.tickCount % 60);
                if(this.tickCount % 60 == 0){
                    this.pong();
                }
                let nextDayTime = (this.daysAlive + 1) * (60 * 20);
                if(this.tickCount > nextDayTime){
                    this.daysAlive += 1;
                    //It has been one day
                    let distance = this.startPosition.distanceTo(this.bot.entity.position);

                    //TODO: Save to memory update brain stats
                    return this.socket.emit('client_day_passed', {
                        username: this.identity.username,
                        daysAlive: this.daysAlive,
                        distanceTraveled: distance,
                        ticks: this.tickCount

                    });
                }
            }, 500)
        })
        this.setupEventListenter('health');
        this.setupEventListenter('chat');
        this.setupEventListenter('onCorrelateAttack');
        this.setupEventListenter('rain');
        this.setupEventListenter('entityMoved');
        this.setupEventListenter('entitySwingArm');
        this.setupEventListenter('entityHurt');
        this.setupEventListenter('entitySpawn');
        this.setupEventListenter('entityUpdate');
        this.setupEventListenter('playerCollect');

        this.setupEventListenter('blockUpdate');
        this.setupEventListenter('diggingCompleted');
        this.setupEventListenter('diggingAborted');
        this.setupEventListenter('blockBreakProgressEnd');
        this.setupEventListenter('blockBreakProgressObserved');
        this.setupEventListenter('chestLidMove');

        this.setupEventListenter('move');
        this.setupEventListenter('forcedMoves');
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
            //this.bot.chat("I am digging");
            this.bot.dig(this.bot._currentlyDigging, cb);

        }

    }
    end(){
        this.bot && this.bot.quit && this.bot.quit();
        //this.bot = null;
        this.settingUp = false;
        this.isSpawned = false;
        clearTimeout(this.processTickInterval);

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
    pong(options?:any){
        options = options || {};
        let payload:any = {
            artificialPong: options.artificialPong || false,
            username: this.identity.username
        }
        if(this.bot && this.bot.entity){
            payload.distanceTraveled = this.startPosition.distanceTo(this.bot.entity.position);
            payload.ticks = this.tickCount;
            payload.position = this.bot.entity.position;
            payload.health = this.bot.health;
            payload.food = this.bot.food;
            payload.inventoryCount = 0;
            payload.ageInSeconds = Math.floor((new Date().getTime() - this.bornDate.getTime()) / 1000);
            this.bot.inventory.slots.forEach((inventorySlot)=> {
                if (!inventorySlot) {
                    return false;
                }
                payload.inventoryCount += 1;
            })
            payload.nodeInfo = {};
            this.brain.eachNodeSync((outputNode)=>{
                payload.nodeInfo[outputNode.id] = {
                    activationCount: outputNode.activationCount
                }
            }, 'output')
        }
        return this.socket.emit('client_pong', payload);
    }




}

export default new App().run()