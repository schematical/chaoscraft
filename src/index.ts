// install the plugin
import * as _ from 'underscore';
import * as request from 'request';
import * as mineflayer from 'mineflayer'
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
    protected _lastData:any = null;
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
                    console.error(err.message, new Error().stack);
                    setTimeout(()=>{
                        this.setupBot();
                    }, 60 * 1000)
                    return;
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
            this.identity._short_username =   this.identity.username;
            if(process.env.CC_USERNAME_PREFIX){
                this.identity._short_username = process.env.CC_USERNAME_PREFIX.substr(0,2).toUpperCase() + this.identity._short_username
            }
            /*switch( this.identity.username){
                case('adam-0'):
            }*/
            if(this.identity._short_username.length >= 14){
                this.identity._short_username = this.identity._short_username.substr(3, 15);
            }
            console.log(this.identity._short_username + " - setupBot - "/* ,ips*/);

            this.bot = mineflayer.createBot({
                host: ips[Math.floor(Math.random() * ips.length)],//config.get('minecraft.host'),//"127.0.0.1", // optional
                //port: 3001,       // optional
                username: this.identity._short_username,
                //password: "12345678",          // online-mode=true servers*/
                verbose: true,
                version: "1.12.2",
                checkTimeoutInterval: 30*1000
            });
            //bloodhoundPlugin(mineflayer)(this.bot);

// turn on yaw correlation, for better distinguishing of attacks within short radius
            //this.bot.bloodhound.yaw_correlation_enabled = true;
            /*this.bot.on('onCorrelateAttack', function (attacker,victim,weapon) {
                //TODO:!!!MATT!!! REMEMBER YOU INCREASED BLOODHOUND MAX_ATTACK_DELTA_TIME to 1000 from 10. Fork it an override
                if(attacker.username == this.identity._short_username){
                    return this.socket.emit('achievement', {
                        type:'attack_success',
                        username: this.identity.username,
                        victim: victim.username,
                        //weapon: weapon
                    });
                }else if(victim.username == this.identity._short_username){
                    return this.socket.emit('achievement', {
                        type:'attack_received',
                        username: this.identity.username,
                        attacker: attacker.username,
                        //weapon: weapon
                    });
                }

            });*/
            this.bot.on('message', (messageData)=>{
                switch(messageData.json.translate){
                    case('chat.type.text'):
                    case('multiplayer.player.joined'):
                    case('multiplayer.player.left'):
                        return;
                }
                console.log("MESSAGE: ", messageData.json.translate)
                let message = messageData.json.translate + ' ';
                messageData.json.with.forEach((d)=>{
                    message += d.text + ' | ';
                })
                const DEATH_PREFIX = 'death.';
                const ADVANCMENT = 'chat.type.advancement.task';
                let achievementType = messageData.json.with[1] && messageData.json.with[1].extra[0].translate || null;

                let parts = message.split(' ');
                if(parts[1] !== this.identity._short_username){
                    return;
                }
                console.log(this.identity.username +  " - message:" + message + " - " + achievementType);
                 if(parts[0] == ADVANCMENT){
                    return this.socket.emit('achievement', {
                        type:achievementType,
                        username: this.identity.username,
                    });
                }
                if(message.substr(0, DEATH_PREFIX.length) == DEATH_PREFIX){


                    return this.socket.emit('client_death', {
                        username: this.identity.username,
                        death_reason:parts[0],
                        victim: parts[1],
                        attacker: parts[3]
                    });
                }

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
                //Moved this to the `on('message'` section
                /*return this.socket.emit('client_death', {
                    username: this.identity.username,
                    event:e
                });*/
            })
            this.bot.on('move', (e)=>{
                if(!this.bot.entity || !this.bot.entity.position){
                    return;
                }
                this.socket.debugEmit('update_position', {
                    x: this.bot.entity.position.x,
                    y: this.bot.entity.position.y,
                    z: this.bot.entity.position.z,
                    pitch: this.bot.pitch,
                    yaw: this.bot.yaw
                });
            })

            this.setupDebugEventListenter('entitySpawn');
            this.setupDebugEventListenter('entityHurt');
            this.setupDebugEventListenter('entityDead');
            this.setupDebugEventListenter('entityMoved');
            this.setupDebugEventListenter('entityUpdate');

                //this.setupDebugEventListenter('entitySwingArm');

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
                    this._lastData = {
                        health: this.bot.health,
                        food: this.bot.food,
                        foodSaturation: this.bot.foodSaturation
                    }

                    console.log(this.identity.username +  " Position:", this.bot.entity.position.x, this.bot.entity.position.y, this.bot.entity.position.z);
                    this.isSpawned = true;
                    this.socket.emit('client_spawn_complete', {
                        username: this.identity.username,
                        startPosition: this.startPosition
                    });
                },10000)
                this._lastData = {
                    health: this.bot.health,
                    food: this.bot.food,
                    foodSaturation: this.bot.foodSaturation
                }

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
            this.setupEventListenter('entityDead');

            this.setupEventListenter('entityUpdate');
            this.setupEventListenter('playerCollect');

            this.setupEventListenter('blockUpdate');
            this.setupEventListenter('diggingCompleted');
            this.setupEventListenter('diggingAborted');
            this.setupEventListenter('blockBreakProgressEnd');
            this.setupEventListenter('blockBreakProgressObserved');
            this.setupEventListenter('chestLidMove');

            //this.setupEventListenter('move');
            this.setupEventListenter('forcedMoves');


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
                    'achievement',
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
                    console.log("Setting up block Listener: " + eventName);
                    let onBlockUpdate = (oldBlock, newBlock)=> {
                        this.bot.removeListener(eventName, onBlockUpdate)
                        if (oldBlock.type === newBlock.type) {
                            return cb(new Error(`No block has been placed : the block is still ${oldBlock.name}`))
                        } else {
                            return cb()
                        }
                    }
                    this.bot.on(eventName, onBlockUpdate);
                    let direction = vectorToDirection(faceVector);
                    if(!direction){
                        return;
                    }
                    this.bot._client.write('block_place', {
                        location: pos,
                        direction: direction,
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
                console.error("Invalid Direction: " + v);
                return null;
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
        this.bot.on(eventType, function(e,param2){
            try {
                let argData = Array.from(arguments);
                let time_delta = null;
                switch (eventType) {
                    case('entityHurt'):
                        time_delta = _this.bot._lastAttackTime - new Date().getTime();
                        if (
                            _this.bot._lastAttackEntity &&
                            _this.bot._lastAttackEntity.id == e.id &&
                            time_delta < 5000
                        ) {
                            _this.socket.emit('achievement', {
                                type: 'attack_success',
                                username: _this.identity.username,
                                victim: e.displayName,
                                //weapon: weapon
                            });
                        }

                        break;
                    case('entityDead'):
                        time_delta = _this.bot._lastAttackTime - new Date().getTime();
                        if (
                            _this.bot._lastAttackEntity &&
                            _this.bot._lastAttackEntity.id == e.id &&
                            time_delta < 5000
                        ) {
                            _this.socket.emit('achievement', {
                                type: 'kill',
                                username: _this.identity.username,
                                victim: e.displayName,
                                victimTypeId: e.entityType
                                //weapon: weapon
                            });
                        }
                        break;
                    case('health'):
                        if (_this._lastData) {
                            argData = argData || [];
                            argData[0] = {
                                last: _this._lastData,
                                delta: {
                                    health: _this._lastData.health - _this.bot.health,
                                    food: _this._lastData.food - _this.bot.food,
                                    foodSaturation: _this._lastData.foodSaturation - _this.bot.foodSaturation,
                                }
                            }
                            _this._lastData = {
                                health: _this.bot.health,
                                food: _this.bot.food,
                                foodSaturation: _this.bot.foodSaturation,
                            }

                            //console.log("HEalth Change:", argData);
                        }
                        break;
                    case('playerCollect'):
                        if(e.username == _this.bot.username) {
                            let object = param2.metadata && param2.metadata[6] && param2.metadata[6];
                            if(!object){
                                console.error("Missing Object for PlayerCollect");
                            }else{
                                _this.socket.emit('achievement', {
                                    type: 'player_collect',
                                    username: _this.identity.username,
                                    target:{
                                        type:object.itemId || object.blockId
                                    },
                                    itemId: object.itemId,
                                    blockId: object.blockId
                                    //weapon: weapon
                                });
                            }


                        }
                    break;

                }

                /*if(eventType == 'chat'){
                 console.log("Chattin");
                 }*/
                _this._tickEvents.push(new TickEvent({
                    type: eventType,
                    data: argData
                }))
            }catch(err){
                console.error(this.identity.username + ' - ' + err.message, err.stack);
            }
        })
    }
    setupDebugEventListenter(eventType){

            this.bot.on(eventType, (entity, param2)=>{

            if(!entity || !entity.position || !this.bot.entity){
                return;
            }
            if(entity.position.distanceTo(this.bot.entity.position) > 10){
                return;
            }
            this.socket.debugEmit('debug_update_entity', {
                entity:{
                    id:entity.id,
                    name:entity.name,
                    type: entity.type,
                    entityType: entity.entityType,
                    healdItem: entity.healdItem,
                    metadata: entity.metadata,
                    position: {
                        x: entity.position.x,
                        y: entity.position.y,
                        z: entity.position.z,
                    },
                    pitch: entity.pitch,
                    yaw: entity.yaw,
                },
                eventType: eventType
            });
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
        //console.log(this.identity.username + " - Sending Pong: ", JSON.stringify(logData));
        return this.socket.emit('client_pong', payload);
    }




}

export default new App().run()