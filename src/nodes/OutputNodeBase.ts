/**
 * Created by user1a on 2/28/18.
 */
import { NodeBase } from './NodeBase'
class OutputNodeBase extends NodeBase{
    protected _activated:boolean = false;
    constructor (options:any){
        super(options);


    }

    activate(options:any):void{
        switch(this.type){
            case('navigateTo'):
                this.navigateTo(options);
                break;
            case('chat'):
                this.chat(options);
                break;
            case('walkForward'):
                this.walkForward();
            break;
            case('walkBack'):
                this.walkBack();
            break;
            case('stopWalking'):
                this.stopWalking();
            break;
            case('lookAt'):
                this.lookAt(options);
            break;
            case('dig'):
                this.dig(options);
            break;
            case('navigateTo'):
                this.navigateTo(options);
                break;
            default:
                throw new Error("Invalid `OutputNodeBase.type`: " + this.type)
        }
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