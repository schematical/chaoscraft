/**
 * Created by user1a on 2/28/18.
 */
import * as _ from 'underscore'
import { NodeBase } from './NodeBase'
import { InputNodeTarget } from '../InputNodeTarget'
import { TickEvent } from "../TickEvent";
class InputNodeBase extends NodeBase{
    protected _target:InputNodeTarget = null;
    constructor (options){
        super(options);
        if(!this.rawNode.target){
            //IDK...
        }
        this._target = new InputNodeTarget({
            node:this,
            rawTargetData: this.rawNode.target
        });

    }

    evaluate():number{
        let score:number = 0;
        switch(this.type){
            case('canSeeEntity'):
                score = this.canSeeEntity();
            break;
            case('canSeeBlock'):
                score = this.canSeeBlock();
            break;
            case('chat'):
                score = this.chat();
            break;
            default:
                throw new Error("Invalid `InputNodeBase.type`: " + this.type)
        }
        return score;
    }


    /**
     * Returns a 1 or a 0 based on weither or not the player can see the position we are describing
     */
    canSeeEntity():number{
        let targetResults = this._target.findEntity();

        if(targetResults.length == 0){
            return 0;
        }

    }

    canSeeBlock():number{
        let targetResults:Array<any> = this._target.findBlock();
        if(targetResults.length == 0){
            return 0;
        }
    }
    searchTickEvents(filter:any):Array<TickEvent>{
        let results = [];
        this.brain.app.tickEvents.forEach((tickEvent:TickEvent)=>{
            if(_.isString(filter)) {
                if (tickEvent.type !== filter) {
                    return false;
                }
            }else if(_.isFunction(filter)){
                if(!filter(tickEvent)){
                    return false;
                }
            }else{
                throw new Error("Invalid `filter` parameter")
            }
            results.push(tickEvent);

        })
        if(results.length > 0){
            console.log("Results:", results)
        }
        return results;
    }
    chat():number{
        let results:Array<TickEvent> = this.searchTickEvents('chat');
        let score = 0;
        results.forEach((result)=> {
            let username = result.data[0];
            let message = result.data[1];
            //TODO: make this a regex thing
            if(this._target.match({ value: message })){
                score += 1;
            }
        })
        return score;
    }
}
export { InputNodeBase }