/**
 * Created by user1a on 2/28/18.
 */
import { Enum } from 'chaoscraft-shared'
import * as _ from 'underscore'
import { NodeBase } from './NodeBase'
import { NodeTarget } from '../NodeTarget'
//import { TickEvent } from "../TickEvent";
import { NodeEvaluateResult } from "../NodeEvaluateResult";
import * as Vec3 from 'vec3';
interface iTickEvent{
    constructor(options:any);
    type:string;
    data:Array<any>;
}
class InputNodeBase extends NodeBase{
    protected _target:NodeTarget = null;
    constructor (options){
        super(options);
        if(!this.rawNode.target){
            //IDK...
        }
        this._target = new NodeTarget({
            node:this,
            rawTargetData: this.rawNode.target
        });

    }

    searchTickEvents(filter:any):Array<iTickEvent>{
        let results = [];
        this.brain.app.tickEvents.forEach((tickEvent:iTickEvent)=>{
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
            case(Enum.InputTypes.debug):
                results = this.debug();
                break
            case(Enum.InputTypes.hasInInventory):
                results = this.hasInInventory();
                break
            case(Enum.InputTypes.blockAt):
                results = this.blockAt();
                break;
            case(Enum.InputTypes.entityAt):
                results = this.entityAt();
                break;
           /*
            case(Enum.InputTypes.canDigBlock):
            results = this.canDigBlock();
            break
           case(Enum.InputTypes.canSeeEntity):
                results = this.canSeeEntity();
            break;
            case(Enum.InputTypes.canSeeBlock):
                results = this.canSeeBlock();
            break;
            case(Enum.InputTypes.canTouchBlock):
                results = this.canTouchBlock();
                break;*/
            case(Enum.InputTypes.hasInInventory):
                results = this.hasInInventory();
            break;
            case(Enum.InputTypes.hasRecipeInInventory):
                results = this.hasRecipeInInventory();
                break;
            case(Enum.InputTypes.chat):
                results = this.chat();
            break;
            case(Enum.InputTypes.onCorrelateAttack):
                results = this.onCorrelateAttack();
            break;
            case(Enum.InputTypes.rain):
                results = this.rain();
                break;
            case(Enum.InputTypes.health):
                results = this.health();
                break;
            case(Enum.InputTypes.entityMoved):
                results = this.entityMoved();
                break;
            case(Enum.InputTypes.entitySwingArm):
                results = this.entitySwingArm();
                break;
            case(Enum.InputTypes.entityHurt):
                results = this.entityHurt();
                break;
            case(Enum.InputTypes.entitySpawn):
                results = this.entitySpawn();
                break;
            case(Enum.InputTypes.playerCollect):
                results = this.playerCollect();
                break;
            case(Enum.InputTypes.blockUpdate):
                results = this.blockUpdate();
                break;
            case(Enum.InputTypes.entityUpdate):
                results = this.entityUpdate();
                break;
            case(Enum.InputTypes.diggingCompleted):
                results = this.diggingCompleted();
                break;
            case(Enum.InputTypes.diggingAborted):
                results = this.diggingAborted();
                break;
            case(Enum.InputTypes.move):
                results = this.move();
                break;
            case(Enum.InputTypes.forcedMove):
                results = this.forcedMove();
                break;
            case(Enum.InputTypes.chestLidMove):
                results = this.chestLidMove();
                break;
            case(Enum.InputTypes.blockBreakProgressObserved):
                results = this.blockBreakProgressObserved();
                break;
            case(Enum.InputTypes.blockBreakProgressEnd):
                results = this.blockBreakProgressEnd();
                break;
            case(Enum.InputTypes.collision):
                results = this.collision();
                break;
            case(Enum.InputTypes.isOn):
                results = this.isOn();
                break;
            case(Enum.InputTypes.isIn):
                results = this.isIn();
                break;
            case(Enum.InputTypes.hasEquipped):
                results = this.hasEquipped();
                break;
            case(Enum.InputTypes.isHolding):
                results = this.isHolding();
                break;

            default:
                throw new Error("Invalid `InputNodeBase.type`: " + this.type)
        }

        return results;
    }
    debug():NodeEvaluateResult{

        return new NodeEvaluateResult({
            score: this.rawNode.score,
            results: [],
            node:this
        });
    }

    blockAt():NodeEvaluateResult{
        let blocks = this._target.findBlock({});

        return new NodeEvaluateResult({
            score: blocks.length > 0 ? 1 : 0,
            results: blocks,
            node:this
        });
    }

    entityAt():NodeEvaluateResult{
        let entities = this._target.findEntity();

        //console.log("TIME:", (new Date().getTime() - startDate)/1000);
        return new NodeEvaluateResult({
            score: entities.length > 0 ? 1 : 0,
            results: entities,
            node:this
        });
    }














    onCorrelateAttack():NodeEvaluateResult{

        let results:Array<iTickEvent> = this.searchTickEvents('onCorrelateAttack');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let attacker = result.data[0];
            let victim = result.data[1];
            let weapon = result.data[2];
            //TODO: Filter against victim and weapon?
            score += 1;
            targets.push(attacker);

        })
        return new NodeEvaluateResult({
            score :results.length > 0 ? 1  : 0,
            results: targets,
            node:this
        });
    }
    hasRecipeInInventory():NodeEvaluateResult{

        let results = this._target.findInventory();
        return new NodeEvaluateResult({
            score :results.length > 0 ? 1 : 0,
            results: results,
            node:this
        });
    }
    hasInInventory():NodeEvaluateResult{

        let results = this._target.findInventory();
        return new NodeEvaluateResult({
            score :results.length > 0 ? 1 : 0,
            results: results,
            node:this
        });
    }
/*    canDigBlock():NodeEvaluateResult{
        let blocks = this._target.findBlock({
            count: 20,
            maxDistance: 2
        })
        let results = [];

        blocks.forEach((block)=>{
            if(!this.brain.bot.canDigBlock(block)){
                return false;
            }
            results.push(block);
        })
        //console.log("TIME:", (new Date().getTime() - startDate)/1000);
        return new NodeEvaluateResult({
            score: results.length > 0 ? 1 : 0,
            results: results,
            node:this
        });
    }
    /!**
     * Returns a 1 or a 0 based on weither or not the player can see the position we are describing
     *!/
    canSeeEntity():NodeEvaluateResult{
        let targetResults = this._target.findEntity();

        if(targetResults.length == 0){
            return new NodeEvaluateResult({
                score: 0,
                node:this
            });
        }
        return new NodeEvaluateResult({
            score :1,
            results: targetResults,
            node:this
        });

    }


    canSeeBlock():NodeEvaluateResult{
        let targetResults:Array<any> = this._target.findBlock();

        return new NodeEvaluateResult({
            score :targetResults.length > 0 ? 1 : 0,
            results: targetResults,
            node:this
        });
    }
    canTouchBlock():NodeEvaluateResult{
        let targetResults:Array<any> = this._target.findBlock({
            maxDistance: 1
        });

        return new NodeEvaluateResult({
            score :targetResults.length > 0 ? 1 : 0,
            results: targetResults,
            node:this
        });
    }*/

    playerCollect():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('playerCollect');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let entity = result.data[0];

            if(this._target.match(entity)){
                score += 1;
                targets.push(entity);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    entityMoved():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('entityMoved');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let entity = result.data[0];

            if(this._target.match(entity)){
                score += 1;
                targets.push(entity);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    entityUpdate():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('entityUpdate');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let entity = result.data[0];

            if(this._target.match(entity)){
                score += 1;
                targets.push(entity);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    entityHurt():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('entityHurt');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let entity = result.data[0];

            if(this._target.match(entity)){
                score += 1;
                targets.push(entity);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    entitySpawn():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('entitySpawn');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let entity = result.data[0];

            if(this._target.match(entity)){
                score += 1;
                targets.push(entity);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }


    entitySwingArm():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('entitySwingArm');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let entity = result.data[0];

            if(this._target.match(entity)){
                score += 1;
                targets.push(entity);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    diggingAborted():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('diggingAborted');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let block = result.data[0];

            if(this._target.match(block)){
                score += 1;
                targets.push(block);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    diggingCompleted():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('diggingCompleted');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let block = result.data[0];

            if(this._target.match(block)){
                score += 1;
                targets.push(block);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    blockUpdate():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('blockUpdate');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let block = result.data[0];

            if(this._target.match(block)){
                score += 1;
                targets.push(block);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    blockBreakProgressObserved():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('blockBreakProgressObserved');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let block = result.data[0];

            if(this._target.match(block)){
                score += 1;
                targets.push(block);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }


    blockBreakProgressEnd():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('blockBreakProgressEnd');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let block = result.data[0];

            if(this._target.match(block)){
                score += 1;
                targets.push(block);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }

    chestLidMove():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('chestLidMove');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let block = result.data[0];

            if(this._target.match(block)){
                score += 1;
                targets.push(block);
            }
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }

    move():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('move');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            score += 1;
            let position = _.clone(this.brain.app.bot.entity.position);
            position.y -= 1;
            targets.push(this.brain.app.bot.blockAt(position));
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    forcedMove():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('forcedMove');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            score += 1;
            let position = _.clone(this.brain.app.bot.entity.position);
            position.y -= 1;
            targets.push(this.brain.app.bot.blockAt(position));
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    rain():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('rain');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            score += 1;
            targets.push(result);
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    collision():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('collision');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            score += 1;
            targets.push(result.data[0]);
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    isOn():NodeEvaluateResult{
        let block = this.brain.app.bot.blockAt(
            new Vec3(
                this.brain.app.bot.entity.position.x,
                this.brain.app.bot.entity.position.y - 1,
                this.brain.app.bot.entity.position.z
            )
        )
        let score = 0;
        let targets = [];
        if(this._target.match(block)){
            score += 1;
            targets.push(block);
        }

        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    isIn():NodeEvaluateResult{
        let block = this.brain.app.bot.blockAt(
            new Vec3(
                this.brain.app.bot.entity.position.x,
                this.brain.app.bot.entity.position.y,
                this.brain.app.bot.entity.position.z
            )
        )
        let score = 0;
        let targets = [];
        if(this._target.match(block)){
            score += 1;
            targets.push(block);
        }

        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    health():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('health');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            score += 1;
            targets.push(result);
        })
        return new NodeEvaluateResult({
            score: score,
            results: targets,
            node: this
        });
    }
    chat():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('chat');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let username = result.data[0];
            let message = result.data[1];
            //TODO: make this a regex thing
            if(this._target.matchChat({ value: message })){
                score += 1;
                if(
                    this.brain.bot.players[username] &&
                    this.brain.bot.players[username].entity
                ) {
                    targets.push(this.brain.bot.players[username].entity);
                }
            }
        })
        return new NodeEvaluateResult({
           score: score,
           results: targets,
           node: this
        });
    }
    hasEquipped():NodeEvaluateResult{

        let results = [];


            this.brain.bot.entity.equipment.forEach((equipmentSlot)=>{
                if(!equipmentSlot){
                    return;

                }

                console.log("TODO:Finish me");
            });


        return new NodeEvaluateResult({
            score: results.length > 0 ? 1 : 0,
            results: results,
            node:this
        });
    }
    isHolding():NodeEvaluateResult{
        let results = [];

        if(
            this.brain.bot.entity.heldItem &&
            this._target.match(this.brain.bot.entity.heldItem)
        ){

            results.push(this.brain.bot.entity.heldItem);
        }

        return new NodeEvaluateResult({
            score: results.length > 0 ? 1 : 0,
            results: results,
            node:this
        });
    }
}
export { InputNodeBase }