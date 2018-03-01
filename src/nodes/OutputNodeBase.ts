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
            case('walkForward'):
                this.walkForward();
            break;
            case('walkBackwards'):
                this.walkBackwards();
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
    /*lookAt(){
        this.brain.bot.lookAt(target);
    }*/
    walkForward(){
        this.brain.bot.setControlState('forward', true);
        this.brain.bot.setControlState('backward', false);
    }
    walkBackwards(){
        this.brain.bot.setControlState('forward', false);
        this.brain.bot.setControlState('backward', true);
    }
    stopWalking(){
        //TODO: Iterate through all directions
        this.brain.bot.setControlState('forward', false);
        this.brain.bot.setControlState('backward', false);
    }
}

export { OutputNodeBase }