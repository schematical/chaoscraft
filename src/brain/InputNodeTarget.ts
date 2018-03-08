import { NodeBase } from './nodes/NodeBase'
import * as _ from 'underscore'
class InputNodeTarget{
    protected rawTargetData:any = null;
    protected _node:NodeBase = null;
    constructor(options){
        this.rawTargetData = options.rawTargetData;
        if(!this.rawTargetData){
            throw new Error("missing `rawTargetData`")
        }
        this._node = options.node;
    }
    get node():NodeBase{
        return this._node;
    }
    match(options:any){
        switch(this.rawTargetData.type){
            case('chat'):
                return this.matchChat(options);
            case ('entity'):
                return this.matchEntity(options);
            case ('block'):
                return this.matchBlock(options);
            case ('item'):
                return this.matchItem(options);
            default:
                throw new Error("Invalid  `InputNodeTarget.type`: " + this.rawTargetData.type)
        }
    }
    matchBlock(block:any):boolean{
        if(this.rawTargetData.type){
            if(block.type != this.rawTargetData.block){
                return false;
            }
        }
        return true;
    }
    matchItem(item:any):boolean{
        if(this.rawTargetData.type){
            if(item.type != this.rawTargetData.item){
                return false;
            }
        }
        return true;
    }
    matchEntity(entity:any):boolean{
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
        return true;
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
            if(!this.matchEntity(entity)){
                return false;
            }
            results.push(entity);
        })
        //Figure out which one is closest
        results = _.sortBy(results, (entity)=>{
            let delta = this.node.brain.bot.position.distanceTo(entity.position);
            return 0 - delta;
        })
        return results;
    }

    /**
     * Finds a block that is similar to the
     * @returns {any}
     */
    findBlock(options?:any):Array<any>{
        options = options || {};
        return this.node.brain.bot.findBlockSync({
            point: this.node.brain.bot.entity.position,
            matching: this.rawTargetData.block,
            maxDistance: this.rawTargetData.maxDistance || 20,
            count: options.count || this.rawTargetData.count || 1,
        })
    }
    findInventory(options?:any):Array<any>{
        let results = [];
        this.node.brain.bot.inventory.slots.forEach((inventorySlot)=>{
            if(!inventorySlot){
                return false;
            }

            let type = 'block';
            switch(this.rawTargetData.type){
                case('block'):
                    type = this.rawTargetData.block;
                break;
                default:
                    type = this.rawTargetData.item;
            }
            if(inventorySlot.type != type){
                return false;
            }
            results.push(inventorySlot);

        })
        return results;
    }
}
export { InputNodeTarget }