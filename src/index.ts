// install the plugin
import * as _ from 'underscore';
import * as request from 'request';
import * as mineflayer from 'mineflayer'
import * as navigatePlugin from 'mineflayer-navigate'
import * as blockFinderPlugin from 'mineflayer-blockfinder'
import * as bloodhoundPlugin from 'mineflayer-bloodhound'
import * as Vec3 from 'vec3'
import * as config from 'config';

import { SocketManager } from './SocketManager'

import { Brain } from './brain/Brain'
import { TickEvent } from './TickEvent'
import { TaskExec } from './TaskExec'
class App {
    protected taskQueue:Array<TaskExec> = [];
    protected lastTickPosition:any = null;
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
    protected lastWorldAge:number = 0;
    //protected entityPositionMatrix:{};
    constructor () {
        console.log("Starting");
        this.connectionCheckInterval = setInterval(this.connectionCheck.bind(this), 10 * 1000);

    }
    connectionCheck(){
        //console.log('connectionCheck');
        if(!this.identity){
            //Waiting on our socket server
            return false;
        }
     /*   if(this.isSpawned){
            return false;
        }*/
        let currWorldAge = -1;
        if(this.bot && this.bot.time && this.bot.time.age){
            currWorldAge = this.bot.time.age || 0;
            //console.log('currWorldAge > this.lastWorldAge', currWorldAge, ' > ', this.lastWorldAge, '==', currWorldAge > this.lastWorldAge)
            if(currWorldAge > this.lastWorldAge){
                this.lastWorldAge = currWorldAge;
                if(this.isSpawned){
                    return false;
                }
            }

        }else {
            //console.log(this.identity.username + " - No defined `this.bot.time.age`");
        }
        this.lastWorldAge = currWorldAge;

        if(!this.connectionAttemptStartDate){
            this.connectionAttemptStartDate = new Date();
            return;
        }
        let connectionTimeInSeconds =(new Date().getTime() - this.connectionAttemptStartDate.getTime())/ 1000;
        if(connectionTimeInSeconds < 30){
            return false; //It has only been less that 30 seconds
        }
        console.log(this.identity.username + " - Starting to reconnect - connectionTimeInSeconds:", connectionTimeInSeconds, 'currWorldAge > this.lastWorldAge', currWorldAge, ' > ', this.lastWorldAge, '==', currWorldAge > this.lastWorldAge, ' isSpawned:', this.isSpawned)
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
    getMinecraftServerIps(){
        return new Promise((resolve, reject)=>{
            return request(
                {
                    url: config.get('server.host') + '/servers',
                    json: true
                },
                (err, response, data)=>{
                    if(err) return reject(err);
                    return resolve(data);
                }
            )
        })
    }
    setupBot(){
        this.getMinecraftServerIps()
            .then((ips:Array<string>)=>{


            this.connectionAttemptStartDate = new Date();
            this.settingUp = true;
            let username =  this.identity.username;
            /*switch( this.identity.username){
                case('adam-0'):
            }*/
            if(username.length >= 14){
                username = username.substr(3, 15);
            }
            console.log(username + " - setupBot - " ,ips);
            this.bot = mineflayer.createBot({
                host: ips[Math.floor(Math.random() * ips.length)],//config.get('minecraft.host'),//"127.0.0.1", // optional
                //port: 3001,       // optional
                username: username,
                //password: "12345678",          // online-mode=true servers*/
                verbose: true,
                version: "1.12.2",
                checkTimeoutInterval: 30*1000
            });
            navigatePlugin(mineflayer)(this.bot);
            bloodhoundPlugin(mineflayer)(this.bot);
            blockFinderPlugin(mineflayer)(this.bot);

            this.bot.on('message', (messageData)=>{
                switch(messageData.json.translate){
                    case('chat.type.text'):
                    case('multiplayer.player.joined'):
                    case('multiplayer.player.left'):
                        return;
                }
                let message = messageData.json.translate + ' ';
                messageData.json.with.forEach((d)=>{
                    message += d.text + ' | ';
                })
                console.log(this.identity.username +  " - message:" + message );
            });
            this.bot.on('connect', ()=>{
                this.isSpawned = false;

                console.log(this.identity.username +  " - Connected!");
            });
            this.bot.on('error', (err)=>{
                console.error(this.identity && this.identity.username + ' - ERROR: ', err.message)
               //this.end();
            });
            this.bot.on('login', ()=>{
                console.log(this.identity.username +  " - Logged In ");

            });
            this.bot.on('end', (status)=>{
                this.isSpawned = false;
                console.log(this.identity && this.identity.username +  " END(DISCONNECTED) FROM MINECRAFT: ", status);
                this.end();
                /*if(this.settingUp){
                    //We are already setting up, just chill
                    return false;
                }
                if(!this.autoReconnect){
                    return false;
                }*/

            })
            this.bot.on('kicked', (reason)=>{
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
                        this.socket.emit('client_request_new_brain', {
                            //username: this.identity.username
                        })
                        setTimeout(()=>{
                            //this.identity = null;
                        }, 1000);
                        return;
                    case('disconnect.spam'):

                        break;
                    case('disconnect.timeout'):
                       //Do nothing
                        break;

                }

                //this.end();
            })
            this.bot.on('disconnect', (e)=>{

                console.log(this.identity.username +  " DISCONNECTED FROM MINECRAFT");
                //this.end();
            })

            this.bot.on("death", (e)=>{
                console.log("Death", e);
                return this.socket.emit('client_death', {
                    username: this.identity.username,
                    event:e
                });
            })
            this.bot.on("spawn", (e)=>{
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
                    this.socket.emit('client_spawn_complete', {
                        username: this.identity.username,
                        startPosition: this.startPosition
                    });
                },10000)


                if(this.processTickInterval){
                        return;//We already set it dont over clock
                }
                this.processTickInterval = setInterval(this.processTick.bind(this), 1000)
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
            /*this.bot.on('entityMoved', (e)=>{
                //Update entityPositionMatrix

            })*/

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
            this.bot.on('onCorrelateAttack',  (attacker,victim,weapon)=> {
                if(attacker.username != this.identity.username){
                    return;
                }
                return this.brain.app.socket.emit(
                    'achivment',
                    {
                        username: this.identity.username,
                        type:'attack',
                        value:1
                    }
                );
            });
            this.bot.smartDig = (block, cb) => {
                if(this.bot._currentlyDigging){
                   //TODO: Cross Check
                    return;
                }
                this.bot.clearControlStates();
                this.bot._currentlyDigging = block;
                setTimeout(()=>{
                    this.bot._currentlyDigging = null;
                }, 4000);
                //this.bot.chat("I am digging " +block.displayName);
                this.bot.dig(this.bot._currentlyDigging, (err)=>{

                    this.bot._currentlyDigging = null;
                    if(err) {
                        console.error("Digging Error:", err.message, err.stack);
                        return cb(err);
                    }
                    console.log("Digging Done: " + block.displayName);
                    return cb(null, block);

                });

            }
            this.bot._controlStates = {};
            this.bot.smartSetControlState = (control, state)=>{
                this.bot._controlStates[control] = state;
                this.bot.setControlState(control, state);
            }
            this.bot.smartPlaceBlock =   (referenceBlock, faceVector, cb) => {
                if (!this.bot.heldItem) return cb(new Error('must be holding an item to place a block'));
                let maxDist = 7;
                let targetPosition = referenceBlock.position;
                let offsetX = 0.5;
                let offsetY = 0.5;
                let offsetZ = 0.5;
                this.bot.lookAt(targetPosition.offset(offsetX, offsetY, offsetZ), false, () => {
                    // TODO: tell the server that we are sneaking while doing this
                    //this.bot.setControlState('sneak', true);
                    this.bot._client.write('arm_animation', { hand: 1 })
                    const pos = referenceBlock.position




                    const dest = pos.plus(faceVector)
                    const eventName = `blockUpdate:${dest}`
                    let onBlockUpdate = (oldBlock, newBlock)=> {
                        this.bot.removeListener(eventName, onBlockUpdate)
                        if (oldBlock.type === newBlock.type) {
                            return cb(new Error(`No block has been placed : the block is still ${oldBlock.name}`))
                        } else {
                            return cb()
                        }
                    }
                    this.bot.on(eventName, onBlockUpdate);

                    this.bot._client.write('block_place', {
                        location: pos,
                        direction: vectorToDirection(faceVector),
                        hand: 0,//Math.round(Math.random()),
                        cursorX: 0.5,//Math.random(),
                        cursorY: 0.5,//Math.random(),
                        cursorZ: 0.5//Math.random()
                    })

                })
            }
            function vectorToDirection (v) {
                if (v.y < 0) {
                    return 0
                } else if (v.y > 0) {
                    return 1
                } else if (v.z < 0) {
                    return 2
                } else if (v.z > 0) {
                    return 3
                } else if (v.x < 0) {
                    return 4
                } else if (v.x > 0) {
                    return 5
                }
                throw new Error("Invalid Direction: " + v)
            }

        })
        .catch((err)=>{
            console.error(err.message, err.stack);
        })

    }
    processTick(){

        if(!this.bot ||!this.bot.entity){
            return console.error("No `this.brain.app.bot.entity`, skipping `processTick`");
        }
        if(this.lastTickPosition){
            if(
                this.bot._controlStates.forward ||
                this.bot._controlStates.back ||
                this.bot._controlStates.left ||
                this.bot._controlStates.right
            ) {
                let distTraveledThisTick = (this.lastTickPosition.distanceTo(this.bot.entity.position));
                if (distTraveledThisTick > .025) {
                    //TODO: Find out what we hit
                    let yaw = this.bot.entity.yaw;
                    let z = Math.sin(yaw) * 1;
                    let x = Math.cos(yaw) * 1;
                    let block = this.bot.blockAt(new Vec3(
                        this.bot.entity.position.x - x,
                        this.bot.entity.position.y,
                        this.bot.entity.position.z - z,
                    ))
                    //Add event collision
                    this._tickEvents.push(new TickEvent({
                        type: 'collision',
                        data: [block]
                    }))
                }
            }
        }
        this.lastTickPosition = _.clone(this.bot.entity.position);

        this.tickCount += 1;
        this.brain.processTick();
        this._tickEvents = [];
        if(this.tickCount % 30 == 0){//15 seconds
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
    }
    end(){
        this.bot && this.bot.quit && this.bot.quit();
        //this.bot = null;
        this.settingUp = false;
        this.isSpawned = false;
        clearTimeout(this.processTickInterval);
        this.processTickInterval = null;

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
            payload.inventory = {};
            this.bot.inventory.slots.forEach((inventorySlot, index)=> {
                if (!inventorySlot) {
                    return false;
                }
                payload.inventory[index] = {
                    count: inventorySlot.count,
                    displayName: inventorySlot.displayName,
                    type: inventorySlot.type
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

        let logData = _.clone(payload);
        delete(logData.nodeInfo);
        console.log(this.identity.username + " - Sending Pong: ", JSON.stringify(logData));
        return this.socket.emit('client_pong', payload);
    }




}

export default new App().run()