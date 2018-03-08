/**
 * Created by user1a on 2/28/18.
 */
import { NodeBase } from './NodeBase'
import { Enum } from 'chaoscraft-shared'

class OutputNodeBase extends NodeBase{
    protected _activated:boolean = false;
    protected debug:any = null;
    constructor (options:any){
        super(options);



    }

    activate(options:any):void{
        switch(this.type){
            case(Enum.OutputTypes.navigateTo):
                this.navigateTo(options);
                break;
            case(Enum.OutputTypes.chat):
                this.chat(options);
                break;
            case(Enum.OutputTypes.walkForward):
                this.walkForward();
            break;
            case(Enum.OutputTypes.walkBack):
                this.walkBack();
            break;
            case(Enum.OutputTypes.stopWalking):
                this.stopWalking();
            break;
            case(Enum.OutputTypes.lookAt):
                this.lookAt(options);
            break;
            case(Enum.OutputTypes.dig):
                this.dig(options);
            break;
            case(Enum.OutputTypes.placeBlock):
                this.placeBlock(options);
            break;
            case(Enum.OutputTypes.equip):
                this.equip(options);
            break;
            case(Enum.OutputTypes.unequip):
                this.unequip(options);
            break;

            case(Enum.OutputTypes.attack):
                this.attack(options);
            break;

            case(Enum.OutputTypes.activateItem):
                this.activateItem(options);
                break;

            case(Enum.OutputTypes.deactivateItem):
                this.deactivateItem(options);
                break;

            case(Enum.OutputTypes.walkLeft):
                this.walkLeft(options);
                break;

            case(Enum.OutputTypes.walkRight):
                this.walkRight(options);
                break;

            case(Enum.OutputTypes.clearControlStates):
                this.clearControlStates(options);
                break;

            case(Enum.OutputTypes.jump):
                this.jump(options);
                break;

            case(Enum.OutputTypes.sprint):
                this.sprint(options);
                break;
            case(Enum.OutputTypes.sneak):
                this.sneak(options);
                break;

            case(Enum.OutputTypes.lookRight):
                this.lookRight(options);
                break;

            case(Enum.OutputTypes.lookLeft):
                this.lookLeft(options);
                break;

            case(Enum.OutputTypes.lookUp):
                this.lookUp(options);
                break;
            case(Enum.OutputTypes.lookDown):
                this.lookDown(options);
                break;
            case(Enum.OutputTypes.toss):
                this.toss(options);
                break;
            case(Enum.OutputTypes.activateBlock):
                this.activateBlock(options);
                break;
            case(Enum.OutputTypes.activateEntity):
                this.activateEntity(options);
                break;
            case(Enum.OutputTypes.useOn):
                this.useOn(options);
                break;
            case(Enum.OutputTypes.craft):
                this.craft(options);
                break;
            case(Enum.OutputTypes.openChest):
                this.openChest(options);
                break;
            case(Enum.OutputTypes.openFurnace):
                this.openFurnace(options);
                break;
            case(Enum.OutputTypes.openDispenser):
                this.openDispenser(options);
                break;
            case(Enum.OutputTypes.openEnchantmentTable):
                this.openEnchantmentTable(options);
                break;
            case(Enum.OutputTypes.openVillager):
                this.openVillager(options);
                break;
            case(Enum.OutputTypes.trade):
                this.trade(options);
                break;
            case(Enum.OutputTypes.openEntity):
                this.openEntity(options);
                break;

            default:
                throw new Error("Invalid `OutputNodeBase.type`: " + this.type)
        }
    }
    craft(options:any){
        return this.brain.debug("TODO:Write this - craft");
        //this.brain.bot.craft(/*recipe, count, craftingTable, [callback]*/);
        /*
            recipe - A Recipe instance. See bot.recipesFor.
            count - How many times you wish to perform the operation. If you want to craft planks into 8 sticks, you would set count to 2. null is an alias for 1.
            craftingTable - A Block instance, the crafting table you wish to use. If the recipe does not require a crafting table, you may use null for this argument.
            callback - (optional) Called when the crafting is complete and your inventory is updated.
        */
    }
    activateItem(options?:any):void{
        this.brain.bot.chat("I am activating stuff");
        try{
            this.brain.bot.activateItem();
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - activateItem - Error', err.message);
        }
    }
    deactivateItem(options?:any):void{
        this.brain.bot.chat("I am deactivateItem");
        try{
            this.brain.bot.deactivateItem();
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - deactivateItem - Error', err.message);
        }
    }

    openEntity(options?:any){
        if(options.results.length == 0){
            throw new Error("No results found to openEntity");
        }
        let target = options.results[0];
        try{
            this.brain.bot.openEntity(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - openEntity - Error', err.message);
        }
    }
    activateEntity(options?:any){
        if(options.results.length == 0){
            throw new Error("No results found to activateEntity");
        }
        let target = options.results[0];
        try{
            this.brain.bot.activateEntity(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - activateEntity - Error', err.message);
        }
    }
    openVillager(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to openVillager");
        }
        let target = options.results[0];
        this.brain.bot.chat("I am openVillager " + target.name + "!");
        try{
            this.brain.bot.openVillager(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - openVillager - Error', err.message);
        }
    }
    trade(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to trade");
        }
        let target = options.results[0];
        this.brain.bot.chat("I am trade " + target.name + "!");
        try{
            this.brain.bot.trade(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - trade - Error', err.message);
        }
    }
    attack(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to attack");
        }
        let target = options.results[0];
        this.brain.bot.chat("I am attacking " + target.username + "!");
        try{
            this.brain.bot.attack(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - attack - Error', err.message);
        }
    }
    useOn(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to useOn");
        }
        let target = options.results[0];
        try{
            this.brain.bot.useOn(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - useOn - Error', err.message);
        }
    }
    equip(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        try {
            this.brain.bot.equip(target, this.rawNode.destination);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - equip - Error', err.message);
        }
    }
    unequip(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        try{
            this.brain.bot.unequip(target, this.rawNode.destination);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - unequip - Error', err.message);
        }
    }
    activateBlock(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to activateBlock");
        }
        let target = options.results[0];
        //TODO: Add currentlyDigging
        //TODO: Add some logic to find block at location if need be
        try {
            if(!target.digTime){
                return this.brain.debug(this.brain.app.identity.username + " - Cannot `activateBlock` : " + target.type)
            }
            this.brain.bot.activateBlock(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - activateBlock - Error', err.message);
        }
    }

    placeBlock(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        //TODO: Add currentlyDigging
        //TODO: Add some logic to find block at location if need be
        try {
            if(!target.digTime){
                return console.error("Cannot Dig Type: " + target.type)
            }
            this.brain.bot.placeBlock(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - placeBlock - Error', err.message);
        }
    }
    dig(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        //TODO: Add currentlyDigging
        //TODO: Add some logic to find block at location if need be

        if(!target.digTime){
            return this.brain.debug( this.brain.app.identity.username + " - Cannot Dig Type: " + target.type)
        }
        try{
            this.brain.bot.smartDig(target, (err, results)=>{
                console.log("Digging Done: ", err, results);
            });
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - dig - Error', err.message);
        }
    }

    navigateTo(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        try{
            this.brain.bot.navigate.to(target.position);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - navigateTo - Error', err.message);
        }
    }
    chat(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        try{
            this.brain.bot.chat("WAZZZUP: " + target.username);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - chat - Error', err.message);
        }
    }
    lookAt(options:any){
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        try{
            this.brain.bot.lookAt(target.position);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - lookAt - Error', err.message);
        }
    }

    walkForward(){
        this.brain.bot.setControlState('forward', true);
        this.brain.bot.setControlState('back', false);
    }
    walkBack(){
        this.brain.bot.setControlState('forward', false);
        this.brain.bot.setControlState('back', true);
    }

    stopWalking(){
        //TODO: Iterate through all directions
        this.brain.bot.setControlState('forward', false);
        this.brain.bot.setControlState('back', false);
        this.brain.bot.setControlState('left', false);
        this.brain.bot.setControlState('right', false);
    }

    walkLeft(options?:any){
        this.brain.bot.setControlState('left', true);
        this.brain.bot.setControlState('right', false);
    }
    walkRight(options?:any){
        this.brain.bot.setControlState('left', false);
        this.brain.bot.setControlState('right', true);
    }

    jump(options?:any){
        this.brain.bot.setControlState('jump', true);
    }
    sneak(options?:any){
        //this.brain.bot.setControlState('sneak', true);
    }
    sprint(options?:any){
        this.brain.bot.setControlState('sprint', true);
    }
    clearControlStates(options?:any){
        this.brain.bot.setControlState('jump', true);
        //this.brain.bot.setControlState('sneak', true);
        this.brain.bot.setControlState('sprint', true);
        this.brain.bot.setControlState('forward', false);
        this.brain.bot.setControlState('back', false);
        this.brain.bot.setControlState('left', false);
        this.brain.bot.setControlState('right', false);
    }

    /**
     * Looks left by 45 degrees
     */
    lookLeft(options?:any){
        let currYaw = this.brain.app.bot.entity.yaw ;
        this.brain.app.bot.look(currYaw + Math.PI / 8, this.brain.app.bot.entity.pitch/*, [force], [callback]*/);
    }
    /**
     * Looks right by 45 degrees
     */
    lookRight(options?:any){
        let currYaw = this.brain.app.bot.entity.yaw ;
        this.brain.app.bot.look(currYaw - Math.PI / 4, this.brain.app.bot.entity.pitch/*, [force], [callback]*/);
    }
    lookUp(options?:any){

        this.brain.app.bot.look(this.brain.app.bot.entity.yaw, this.brain.app.bot.entity.pitch  + Math.PI / 4/*, [force], [callback]*/);
    }
    lookDown(options?:any){

        this.brain.app.bot.look(this.brain.app.bot.entity.yaw, this.brain.app.bot.entity.pitch  - Math.PI / 4/*, [force], [callback]*/);
    }
    toss(options:any):void{
            if(options.results.length == 0){
            throw new Error("No results found to toss");
        }
        let target = options.results[0];
        try{
            this.brain.bot.toss(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - toss - Error', err.message);
        }
    }
    openChest(options:any){
        if(options.results.length == 0){
            throw new Error("No results found to openChest");
        }
        let target = options.results[0];
        //TODO: Add some logic to find block at location if need be
        try{
            this.brain.bot.openChest(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - openChest - Error', err.message);
        }

    }
    openFurnace(options:any){
        if(options.results.length == 0){
            throw new Error("No results found to openChest");
        }
        let target = options.results[0];
        //TODO: Add some logic to find block at location if need be
        try{
            this.brain.bot.openChest(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - openFurnace - Error', err.message);
        }
    }
    openDispenser(options:any){
        if(options.results.length == 0){
            throw new Error("No results found to openDispenser");
        }
        let target = options.results[0];
        //TODO: Add some logic to find block at location if need be
        try{
            this.brain.bot.openDispenser(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - openDispenser - Error', err.message);
        }
    }
    openEnchantmentTable(options:any){
        if(options.results.length == 0){
            throw new Error("No results found to openEnchantmentTable");
        }
        let target = options.results[0];
        //TODO: Add some logic to find block at location if need be
        try{
            this.brain.bot.openEnchantmentTable(target);
        }catch(err){
            this.brain.debug(this.brain.app.identity.username + ' - openEnchantmentTable - Error', err.message);
        }

    }


}

export { OutputNodeBase }