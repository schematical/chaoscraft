/**
 * Created by user1a on 2/28/18.
 */
import { NodeBase } from './NodeBase'
import { Enum } from 'chaoscraft-shared'
class OutputNodeBase extends NodeBase{
    protected _activated:boolean = false;
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
            case(Enum.OutputTypes.attack):
                this.attack(options);
            break;

            case(Enum.OutputTypes.activateItem):
                this.activateItem(options);
                break;
            default:
                throw new Error("Invalid `OutputNodeBase.type`: " + this.type)
        }
    }
    activateItem(options:any):void{
        this.brain.bot.chat("I am activating stuff");
        this.brain.bot.activateItem();
    }
    attack(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        this.brain.bot.chat("I am attacking " + target.username + "!");
        this.brain.bot.attack(target);
    }
    equip(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];

        this.brain.bot.equip(target, this.rawNode.destination);
    }
    placeBlock(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        //TODO: Add currentlyDigging
        //TODO: Add some logic to find block at location if need be
        this.brain.bot.smartDig(target);
    }
    dig(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        //TODO: Add currentlyDigging
        //TODO: Add some logic to find block at location if need be
        this.brain.bot.smartDig(target, (err, results)=>{
            console.log("Digging Done: ", err, results);
        });
    }

    navigateTo(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        this.brain.bot.navigate.to(target.position);
    }
    chat(options:any):void{
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        this.brain.bot.chat("WAZZZUP: " + target.username);
    }
    lookAt(options:any){
        if(options.results.length == 0){
            throw new Error("No results found to look at");
        }
        let target = options.results[0];
        this.brain.bot.lookAt(target.position);
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
    }
}

export { OutputNodeBase }