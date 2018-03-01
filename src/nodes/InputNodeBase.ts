/**
 * Created by user1a on 2/28/18.
 */
import * as _ from 'underscore'
import { NodeBase } from './NodeBase'
import { InputNodeTarget } from '../InputNodeTarget'
import { TickEvent } from "../TickEvent";
import { NodeEvaluateResult } from "../NodeEvaluateResult"
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
       /* if(results.length > 0){
            console.log("Results:", results)
        }*/
        return results;
    }
    evaluate():NodeEvaluateResult{
        let results:NodeEvaluateResult = null;
        switch(this.type){
            case('hasInInventory'):
                results = this.hasInInventory();
                break
            case('canSeeEntity'):
                results = this.canSeeEntity();
            break;
            case('canSeeBlock'):
                results = this.canSeeBlock();
            break;
            case('chat'):
                results = this.chat();
            break;
            default:
                throw new Error("Invalid `InputNodeBase.type`: " + this.type)
        }
        return results;
    }

    hasInInventory():NodeEvaluateResult{
        //TODO: Write this
        //bot.inventory
        return new NodeEvaluateResult({
            score :0,
            targets: null
        });;
    }
    /**
     * Returns a 1 or a 0 based on weither or not the player can see the position we are describing
     */
    canSeeEntity():NodeEvaluateResult{
        let targetResults = this._target.findEntity();

        if(targetResults.length == 0){
            return new NodeEvaluateResult({
                score: 0
            });
        }
        return new NodeEvaluateResult({
            score :1,
            targets: targetResults
        });

    }

    canSeeBlock():NodeEvaluateResult{
        let targetResults:Array<any> = this._target.findBlock();
        if(targetResults.length == 0){
            return new NodeEvaluateResult({
                score :0
            });
        }
        return new NodeEvaluateResult({
            score :1,
            targets: targetResults
        });
    }

    chat():NodeEvaluateResult{
        let results:Array<TickEvent> = this.searchTickEvents('chat');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let username = result.data[0];
            let message = result.data[1];
            //TODO: make this a regex thing
            if(this._target.match({ value: message })){
                score += 1;
                targets.push(this.brain.bot.players[username].entity);
            }
        })
        return new NodeEvaluateResult({
           score: score,
           results: targets,
           node: this
        });
    }
}
export { InputNodeBase }