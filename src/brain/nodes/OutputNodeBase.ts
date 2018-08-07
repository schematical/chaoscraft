/**
 * Created by user1a on 2/28/18.
 */
import { NodeBase } from './NodeBase'
import { Enum } from 'chaoscraft-shared'
import * as Vec3 from 'vec3'
import * as _ from 'underscore';
import * as config from 'config';
import {NodeEvaluateResult} from "../NodeEvaluateResult";
import { NodeTarget } from '../NodeTarget'
class OutputNodeBase extends NodeBase{
    protected _activated:boolean = false;
    protected _activationCount:number = 0;
    protected _activationErrorCount:number = 0;
    protected _cooldown:number = 0;
    protected _target:NodeTarget = null;
    constructor (options:any){

        super(options);
        if(this.rawNode.target) {
            this._target = new NodeTarget({
                node: this,
                rawTargetData: this.rawNode.target
            });
        }
    }
    evaluate():NodeEvaluateResult{

        if(this._cooldown > 0){
            this._cooldown -= 1;
            return new NodeEvaluateResult({
                score: 0,
                results: [],
                node: this
            });
        }
        let result:NodeEvaluateResult = super.evaluate();
        return result;
    }

    logActivationError(data:any, data2?:any){
        this._activationErrorCount += 1;
        this.brain.debug.apply(this.brain.debug, arguments);
    }
    get activationCount(){
        return this._activationCount;
    }
    get errorThresholdHit(){
        return this._activationErrorCount > config.get('brain.outputNodeErrorThreshold');
    }
    activate(options:any):boolean{
        this._activationCount += 1;
        this._cooldown = this.rawNode.cooldown || 8;
        switch(this.type){

            case(Enum.OutputTypes.chat):
                return this.chat(options);
            case(Enum.OutputTypes.walkForward):
                return this.walkForward();
            case(Enum.OutputTypes.walkBack):
                return this.walkBack();
            case(Enum.OutputTypes.stopWalking):
                return this.stopWalking();
            /*case(Enum.OutputTypes.lookAt):
                return this.lookAt(options);*/
       
            case(Enum.OutputTypes.dig):
                return this.dig(options);
       
            case(Enum.OutputTypes.placeBlock):
                return this.placeBlock(options);
       
            case(Enum.OutputTypes.equip):
                return this.equip(options);
       
            case(Enum.OutputTypes.unequip):
                return this.unequip(options);
       

            case(Enum.OutputTypes.attack):
                return this.attack(options);
       

            case(Enum.OutputTypes.activateItem):
                return this.activateItem(options);

            case(Enum.OutputTypes.deactivateItem):
                return this.deactivateItem(options);

            case(Enum.OutputTypes.walkLeft):
                return this.walkLeft(options);

            case(Enum.OutputTypes.walkRight):
                return this.walkRight(options);

            case(Enum.OutputTypes.clearControlStates):
                return this.clearControlStates(options);

            case(Enum.OutputTypes.jump):
                return this.jump(options);

            case(Enum.OutputTypes.sprint):
                return this.sprint(options);
            case(Enum.OutputTypes.sneak):
                return this.sneak(options);

            case(Enum.OutputTypes.lookRight):
                return this.lookRight(options);

            case(Enum.OutputTypes.lookLeft):
                return this.lookLeft(options);

            case(Enum.OutputTypes.lookUp):
                return this.lookUp(options);
            case(Enum.OutputTypes.lookDown):
                return this.lookDown(options);
            case(Enum.OutputTypes.tossStack):
                return this.tossStack(options);
            case(Enum.OutputTypes.toss):
                return this.toss(options);
            case(Enum.OutputTypes.activateBlock):
                return this.activateBlock(options);
            case(Enum.OutputTypes.activateEntity):
                return this.activateEntity(options);
            case(Enum.OutputTypes.useOn):
                return this.useOn(options);
            case(Enum.OutputTypes.craft):
                return this.craft(options);
            case(Enum.OutputTypes.openChest):
                return this.openChest(options);
            case(Enum.OutputTypes.openFurnace):
                return this.openFurnace(options);
            case(Enum.OutputTypes.openDispenser):
                return this.openDispenser(options);
            case(Enum.OutputTypes.openEnchantmentTable):
                return this.openEnchantmentTable(options);
            case(Enum.OutputTypes.openVillager):
                return this.openVillager(options);
            case(Enum.OutputTypes.trade):
                return this.trade(options);
            case(Enum.OutputTypes.openEntity):
                return this.openEntity(options);
           /* case(Enum.OutputTypes.walkTo):
                return this.walkTo(options);*/
            default:
                throw new Error("Invalid `OutputNodeBase.type`: " + this.type)
        }
    }

    attack(options:any):boolean{

        let targets = this._target.findEntity();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - craft - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        if(this.brain.bot.entity.position.distanceTo(target.position) > 10){
            return false;
        }
        this.brain.bot.chat("I am attacking " + target.type + " - " + target.displayName + " - " + target.username + "!");
        try{
            this.brain.bot.attack(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - attack - Error', err.message);
            return false;
        }
        this.brain.app.socket.emit(
            'achievement',
            {
                username: this.brain.app.identity.username,
                type:'attack',
                value:1
            }
        );
        return true;
    }


    craft(options:any){
        let targets = this._target.findRecipeInInventory();
        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - craft - Error', "No results found to activateEntity");
            return false;
        }
        let target = targets[0];
        try{

            let recipe = target;
            let count = 1;
            let craftingTable = null;
            if(recipe.requiresTable) {
                let CRAFTING_TABLE_RANGE = 3;

                for (let x = this.brain.bot.entity.position.x - CRAFTING_TABLE_RANGE; x <= this.brain.bot.entity.position.x + CRAFTING_TABLE_RANGE; x++) {
                    for (let y = this.brain.bot.entity.position.y - CRAFTING_TABLE_RANGE; y <= this.brain.bot.entity.position.y + CRAFTING_TABLE_RANGE; y++) {
                        for (let z = this.brain.bot.entity.position.z - CRAFTING_TABLE_RANGE; z <= this.brain.bot.entity.position.z + CRAFTING_TABLE_RANGE; z++) {
                            let block = this.brain.bot.blockAt(new Vec3(x, y, z));
                            if (block.type == 58) {
                                craftingTable = block;
                            }
                        }
                    }
                }
                if (!craftingTable) {
                    this.logActivationError(this.brain.app.identity.username + ' - craft - Error: No crafting table near');
                    return false;
                }
            }
            this.brain.app.socket.emit(
                'achievement',
                {
                    username: this.brain.app.identity.username,
                    type:'craft_attempt',
                    value:1
                }
            );
            this.brain.bot.craft(recipe, count, craftingTable, (err, results)=>{
                if(err){
                    this.logActivationError(this.brain.app.identity.username + ' - craft - Error 2', err.message);
                    console.error(err.stack);
                    return false;
                }
                console.log("CRAFT SUCCESS!!!!", results, recipe);
                this.brain.bot.chat("I crafted  " + recipe.result.count + " of " + recipe.result.id);
                return this.brain.app.socket.emit(
                    'achievement',
                    {
                        username: this.brain.app.identity.username,
                        type:'craft',
                        value:1
                    }
                );
            });

        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - craft - Error', err.message);
            console.error(err.stack);
            return false;
        }
        return true;

        /*
            recipe - A Recipe instance. See bot.recipesFor.
            count - How many times you wish to perform the operation. If you want to craft planks into 8 sticks, you would set count to 2. null is an alias for 1.
            craftingTable - A Block instance, the crafting table you wish to use. If the recipe does not require a crafting table, you may use null for this argument.
            callback - (optional) Called when the crafting is complete and your inventory is updated.
        */
    }
    activateItem(options?:any):boolean{
        //this.brain.bot.chat("I am activating stuff");
        try{
            this.brain.bot.activateItem();

        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - activateItem - Error', err.message);
            return false;
        }
        return true;
    }
    deactivateItem(options?:any):boolean{
        //this.brain.bot.chat("I am deactivateItem");
        try{
            this.brain.bot.deactivateItem();

        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - deactivateItem - Error', err.message);
            return false;
        }
        return true;
    }

    openEntity(options?:any){
        let targets = this._target.findEntity();
        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - craft - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        try{
            this.brain.bot.openEntity(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - openEntity - Error', err.message);
            return false;
        }
        return true;
    }
    activateEntity(options?:any){
        let targets = this._target.findEntity();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - craft - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        try{
            this.brain.bot.activateEntity(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - activateEntity - Error', err.message);
            return false;
        }
        return true;
    }
    openVillager(options:any):boolean{
        let targets = this._target.findEntity();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - craft - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        this.brain.bot.chat("I am openVillager " + target.name + "!");
        try{
            this.brain.bot.openVillager(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - openVillager - Error', err.message);
            return false;
        }
        return true;
    }
    trade(options:any):boolean{
        let targets = this._target.findEntity();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - craft - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        this.brain.bot.chat("I am trade " + target.name + "!");
        try{
            this.brain.bot.trade(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - trade - Error', err.message);
            return false;
        }
        this.brain.app.socket.emit(
            'achievement',
            {
                username: this.brain.app.identity.username,
                type:'trade',
                value:1
            }
        );
        return true;
    }

    useOn(options:any):boolean{
        let targets = this._target.findEntity();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - craft - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        try{
            this.brain.bot.useOn(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - useOn - Error', err.message);
            return false;
        }
        return true;
    }
    equip(options:any):boolean{
        let targets = this._target.findInventory();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - equip - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        try {
            this.brain.app.socket.emit(
                'achievement',
                {
                    username: this.brain.app.identity.username,
                    type:'equip_attempt',
                    value:1
                }
            );
            if(
                this.brain.app.bot.heldItem &&
                this.brain.app.bot.heldItem.type == target.type &&
                this.brain.app.bot.heldItem.metadata == target.metadata
            ){
                return true;
            }

            let destination = this.rawNode.destination || 'hand';
            this.brain.bot.chat("I am trying to equip: " + target.displayName + ' to my ' + destination);

            this.brain.bot.equip(
                target,
                destination,
                (err)=>{
                    if(err){
                        this.logActivationError(this.brain.app.identity.username + ' - equip - cb Error', err.message);
                        this.brain.bot.chat("Equipping  " + target.displayName + ' to my ' + destination + ' failed because ' + err.message);
                        return false;
                    }
                    if(!target.displayName == this.brain.app.bot.heldItem.displayName){
                        this.brain.bot.chat("Equipping  " + target.displayName + ' to my ' + destination + ' failed because on check missmatch');
                        return false;
                    }
                    this.brain.bot.chat("I successfully equipped  " + target.displayName + ' to my ' + destination + '. My held item is ' + this.brain.app.bot.heldItem.displayName + '!!');

                    this.brain.app.socket.emit(
                        'achievement',
                        {
                            username: this.brain.app.identity.username,
                            type:'equip',
                            value:1
                        }
                    );
                }
            );
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - equip - Error', err.message);
            return false;
        }

        return true;
    }
    unequip(options:any):boolean{
        let targets = this._target.findInventory();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - unequip - Error', "No results found to unequip");
            return false;
        }
        let target = targets[0];
        try{
            this.brain.bot.unequip(target, this.rawNode.destination);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - unequip - Error', err.message);
            return false;
        }
        return true;
    }
    activateBlock(options:any):boolean{
        let targets = this._target.findBlock();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - equip - Error', "No results found to activateBlock");
            return false;
        }
        let target = targets[0];
        //TODO: Add currentlyDigging
        //TODO: Add some logic to find block at location if need be
        try {
            if(!target.digTime){
                this.logActivationError(this.brain.app.identity.username + " - Cannot `activateBlock` : " + target.type);
                return false;
            }
            this.brain.bot.activateBlock(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - activateBlock - Error', err.message);
            return false;
        }
        return true;
    }

    placeBlock(options:any):boolean{
        let targets = this._target.findBlock();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - equip - Error', "No results found to placeBlock");
            return false;
        }

        //TODO: Add currentlyDigging
        //TODO: Add some logic to find block at location if need be
        try {

            if(!this.brain.app.bot.heldItem){
                this.logActivationError(this.brain.app.identity.username + ' - placeBlock - Error',"I am not holding an item... ");
                return false;
            }
            let target = null;
            let foundVec = null;
            for(let i in targets){
                target = targets[i];
                if(!target || !target.digTime){
                    this.logActivationError(this.brain.app.identity.username + ' - placeBlock - Error',"Place Block Type:: " + target.type);
                    return false;
                }
                for(let xx = -1; xx <= 1; xx ++){
                    for(let yy = -1; yy <= 1; yy ++){
                        for(let zz = -1; zz <= 1; zz ++){
                            let block =  this.brain.bot.blockAt(
                                target.position.offset(xx, yy, zz)
                            );

                            if(
                                _.indexOf([0,8,9,10,11, 31, '31:1','31:2',32], block.type) !== -1
                            ){
                                foundVec =  new Vec3(xx, yy, zz);;
                                break;
                                break;
                                break;
                                break;
                            }
                        }
                    }
                }
            }

            if(!foundVec){
                this.logActivationError(this.brain.app.identity.username + ' - placeBlock - Error',"No valid Vec found (Block was not Air, Water, Lava) ");
                return false;
            }
           /* let x = 0;
            let y = 0;
            let z = 0;
            while(x == 0 && y ==0 && z == 0){
                x = Math.round(Math.random() * 2) -1;
                y = Math.round(Math.random() * 2) -1;
                z = Math.round(Math.random() * 2) -1;
            }
            let vec = new Vec3(
                x,y,z
            );*/


            this.brain.app.socket.emit(
                'achievement',
                {
                    username: this.brain.app.identity.username,
                    type:'place_block_attempt',
                    value:1,
                    target:{
                        type: target.type,
                        position:{
                            x: target.position.x,
                            y: target.position.y,
                            z: target.position.z
                        }
                    }
                }
            );


            this.brain.bot.chat("I am trying to place block: " + this.brain.app.bot.heldItem.displayName + ' next to ' + target.displayName);
            this.brain.bot.smartPlaceBlock(target, foundVec, (err, results)=>{
                if(err){
                    this.logActivationError(this.brain.app.identity.username + ' - placeBlock - cb Error2', err.message);
                    return false;
                }
                this.brain.bot.chat("I placed block: " + this.brain.app.bot.heldItem.displayName + ' next to ' + target.displayName);
                console.log("Placing Block DOne: ", results);
                return this.brain.app.socket.emit(
                    'achievement',
                    {
                        username: this.brain.app.identity.username,
                        type:'place_block',
                        value:1,
                        target: {
                            type: target.type,
                            position: {
                                x: target.position.x,
                                y: target.position.y,
                                z: target.position.z
                            }
                        }
                    }
                );
            });
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - placeBlock - Error', err.message);
            console.error(err.stack)
            return false;
        }
        return true;
    }
    dig(options:any):boolean{
        let targets = this._target.findBlock();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - equip - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        //TODO: Add currentlyDigging
        //TODO: Add some logic to find block at location if need be

        if(!target.digTime){
            this.logActivationError( this.brain.app.identity.username + " - Cannot Dig Type: " + target.type);
            return false;
        }
        try{
            this.brain.bot.chat("I am digging: " + target.displayName + '  ' + 0/*index*/ + ' out of ' + options.results.length + ' possable blocks');
            this.brain.bot.smartDig(target, (err, results)=>{
                if(err){
                    this.logActivationError(this.brain.app.identity.username + ' - dig - Error', err.message);
                }
                return this.brain.app.socket.emit(
                    'achievement',
                    {
                        username: this.brain.app.identity.username,
                        type:'dig',
                        value:1,
                        target:{
                            type: target.type,
                            position:{
                                x: target.position.x,
                                y: target.position.y,
                                z: target.position.z
                            }
                        }
                    }
                );
            });
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - dig - Error', err.message);
            return false;
        }
        return true;
    }


    chat(options:any):boolean{
        if(options.results.length == 0 || !options.results[0]){
            this.logActivationError(this.brain.app.identity.username + ' - chat - Error', "No results found to look at");
            return false;
        }
        let target = options.results[0];
        try{
            this.brain.bot.chat("WAZZZUP: " + target.username);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - chat - Error', err.message);
            return false;
        }
        return true;
    }
    /*lookAt(options:any){
        if(options.results.length == 0 || !options.results[0]){
            this.logActivationError(this.brain.app.identity.username + ' - lookAt - Error', "No results found to look at");
            return false;
        }
        let target = options.results[0];
        try{
            this.brain.bot.lookAt(target.position);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - lookAt - Error', err.message);
            return false;
        }

        return true;
    }*/

    /*walkTo(options:any){
        if(options.results.length == 0 || !options.results[0]){
            this.logActivationError(this.brain.app.identity.username + ' - lookAt - Error', "No results found to look at");
            return false;
        }
        let target = options.results[0];
        try{
            this.brain.bot.lookAt(target.position);
            this.brain.bot.smartSetControlState('forward', true);
            this.brain.bot.smartSetControlState('back', false);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - lookAt - Error', err.message);
            return false;
        }
        return true;
    }*/

    walkForward(){
        this.brain.bot.smartSetControlState('forward', true);
        this.brain.bot.smartSetControlState('back', false);
        return true;
    }
    walkBack(){
        this.brain.bot.smartSetControlState('forward', false);
        this.brain.bot.smartSetControlState('back', true);
        return true;
    }

    stopWalking(){
        //TODO: Iterate through all directions
        this.brain.bot.smartSetControlState('forward', false);
        this.brain.bot.smartSetControlState('back', false);
        this.brain.bot.smartSetControlState('left', false);
        this.brain.bot.smartSetControlState('right', false);
        return true;
    }

    walkLeft(options?:any){
        this.brain.bot.smartSetControlState('left', true);
        this.brain.bot.smartSetControlState('right', false);
        return true;
    }
    walkRight(options?:any){
        this.brain.bot.smartSetControlState('left', false);
        this.brain.bot.smartSetControlState('right', true);
        return true;
    }

    jump(options?:any){
        this.brain.bot.smartSetControlState('jump', true);
        return true;
    }
    sneak(options?:any){
        //this.brain.bot.smartSetControlState('sneak', true);
        return true;
    }
    sprint(options?:any){
        this.brain.bot.smartSetControlState('sprint', true);
        return true;
    }
    clearControlStates(options?:any){
        this.brain.bot.smartSetControlState('jump', true);
        //this.brain.bot.smartSetControlState('sneak', true);
        this.brain.bot.smartSetControlState('sprint', true);
        this.brain.bot.smartSetControlState('forward', false);
        this.brain.bot.smartSetControlState('back', false);
        this.brain.bot.smartSetControlState('left', false);
        this.brain.bot.smartSetControlState('right', false);
        return true;
    }

    /**
     * Looks left by 45 degrees
     */
    lookLeft(options?:any){
        let currYaw = this.brain.app.bot.entity.yaw ;
        this.brain.app.bot.look(currYaw + Math.PI / 8, this.brain.app.bot.entity.pitch/*, [force], [callback]*/);
        return true;
    }
    /**
     * Looks right by 45 degrees
     */
    lookRight(options?:any){
        let currYaw = this.brain.app.bot.entity.yaw ;
        this.brain.app.bot.look(currYaw - Math.PI / 4, this.brain.app.bot.entity.pitch/*, [force], [callback]*/);
        return true;
    }
    lookUp(options?:any){

        this.brain.app.bot.look(this.brain.app.bot.entity.yaw, this.brain.app.bot.entity.pitch  + Math.PI / 4/*, [force], [callback]*/);
        return true;
    }
    lookDown(options?:any){

        this.brain.app.bot.look(this.brain.app.bot.entity.yaw, this.brain.app.bot.entity.pitch  - Math.PI / 4/*, [force], [callback]*/);
        return true;
    }
    tossStack(options:any):boolean{
        let targets = this._target.findInventory();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - equip - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        try{
            this.brain.bot.tossStack(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - toss - Error', err.message);
            return false;
        }
        return true;
    }
    toss(options:any):boolean{
        let targets = this._target.findInventory();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - equip - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];

        try{
            this.brain.bot.toss(target.type, target.metadata, null, (err)=>{
                if(err){
                    return this.logActivationError(this.brain.app.identity.username + ' - toss - Error', err.message);
                }
                console.log(this.brain.app.identity.username + "Toss Successful: " + target.name);
            });
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - toss - Error', err.message);
            return false;
        }
        return true;
    }
    openChest(options:any){
        let targets = this._target.findBlock();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - equip - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        //TODO: Add some logic to find block at location if need be
        try{
            this.brain.bot.openChest(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - openChest - Error', err.message);
            return false;
        }
        return true;

    }
    openFurnace(options:any){
        let targets = this._target.findBlock();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - equip - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        try{
            this.brain.bot.openChest(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - openFurnace - Error', err.message);
            return false;
        }
        return true;
    }
    openDispenser(options:any){
        let targets = this._target.findBlock();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - equip - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        try{
            this.brain.bot.openDispenser(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - openDispenser - Error', err.message);
            return false;
        }
        return true;
    }
    openEnchantmentTable(options:any){
        let targets = this._target.findBlock();

        if(targets.length == 0 || !targets[0]){
            //this.logActivationError(this.brain.app.identity.username + ' - equip - Error', "No results found to attack");
            return false;
        }
        let target = targets[0];
        try{
            this.brain.bot.openEnchantmentTable(target);
        }catch(err){
            this.logActivationError(this.brain.app.identity.username + ' - openEnchantmentTable - Error', err.message);
            return false;
        }
        return true;

    }


}

export { OutputNodeBase }