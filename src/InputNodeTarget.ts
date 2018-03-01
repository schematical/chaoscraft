import { NodeBase } from './nodes/NodeBase'
import * as _ from 'underscore'
class InputNodeTarget{
    protected rawTargetData:any = null;
    protected _node:NodeBase = null;
    constructor(options){
        this.rawTargetData = options.rawTargetData;
        this._node = options.node;
    }
    get node():NodeBase{
        return this._node;
    }
    match(options:any){
        switch(this.node.type){
            case('chat'):
                return this.matchChat(options);
            //break;
            default:
                throw new Error("Invalid  `InputNodeTarget.type`: " + this.rawTargetData.type)
        }
    }
    matchChat(options:any):boolean{
        if(options.value && options.value !== this.rawTargetData.value){
            return false;
        }
        return true;
    }
    /**
     * should return any targets that are near
     */
    find():Array<any>{
        switch(this.rawTargetData.type){
            case('global'):
            case('other'):
            case('orb'):
            case('object'):
            case('mob'):
            case('player'):
            case('entity'):
                return this.findEntity();
            //break;
            case('block'):
                return this.findBlock();
            //break;
            default:
                throw new Error("Invalid  `InputNodeTarget.type`: " + this.rawTargetData.type)
        }
    }
    findEntity():Array<any>{
        let results = [];
        Object.keys(this.node.brain.bot.entities).forEach((entityId)=>{
            let entity = this.node.brain.bot.entities[entityId];
            if(this.rawTargetData.type){
                if(entity.type != this.rawTargetData.type){
                    return false;
                }
            }

            if(this.rawTargetData.mobType){
                if(!entity.mobType || entity.mobType != this.rawTargetData.mobType){
                    return false;
                }
            }

            if(this.rawTargetData.entityType){
                if(entity.entityType != this.rawTargetData.entityType){
                    return false;
                }
            }

            if(this.rawTargetData.kind){
                if(entity.kind != this.rawTargetData.kind){
                    return false;
                }
            }

            if(this.rawTargetData.objectType){
                if(!entity.objectType || entity.objectType != this.rawTargetData.objectType){
                    return false;
                }
            }

            if(this.rawTargetData.onGround){
                if(entity.onGround != this.rawTargetData.onGround){
                    return false;
                }
            }



            //TODO:Health/Food Mongo Syntax { $gt: xyz }

            //TODO: Equipment - https://github.com/PrismarineJS/prismarine-entity#entityequipment5
        })
        //Figure out which one is closest
        results = _.sortBy(results, (entity)=>{
            let delta = this.node.brain.bot.position.minus(entity.position);
            //TODO: Double check the math on this
            const groundDistance = Math.sqrt(delta.x * delta.x + delta.z * delta.z);
            const realDistance = Math.sqrt(groundDistance & groundDistance + delta.y * delta.y);
            return 0 - realDistance;
        })
        return results;
    }

    /**
     * Finds a block that is similar to the
     * @returns {any}
     */
    findBlock():Array<any>{
        return this.node.brain.bot.findBlockSync({
            point: this.node.brain.bot.entity.position,
            matching: this.rawTargetData.block,
            maxDistance: this.rawTargetData.maxDistance || 20,
            count: this.rawTargetData.count || 1,
        })
    }
}
export { InputNodeTarget }