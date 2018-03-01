/**
 * Created by user1a on 2/28/18.
 */
import { NodeBase } from './NodeBase'
class OutputNodeBase extends NodeBase{
    protected _activated:boolean = false;
    constructor (options:any){
        super(options);


    }

    activate():void{
        switch(this.type){
            case('chat'):
                this.chat();
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
           /* case('lookAt'):
                this.lookAt();
            break;*/
            default:
                throw new Error("Invalid `OutputNodeBase.type`: " + this.type)
        }
    }
    chat():void{
        this.brain.bot.chat("WAZZZUP");
    }
    /*lookAt(){
        this.brain.bot.lookAt(target);
    }*/
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