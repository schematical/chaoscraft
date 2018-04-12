import { NodeBase } from './nodes/NodeBase'
import * as _ from 'underscore'
import * as MinecraftData from 'minecraft-data';
import * as config from 'config'
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
        if(!block){
            return false;
        }
        if(this.rawTargetData.type){
            if(_.isString(this.rawTargetData.block)){
                if(block.type != this.rawTargetData.block){
                    return false;
                }
            }else{
                let matchesABlock = false;
                this.rawTargetData.block.forEach((_block)=>{
                    if(block.type == _block){
                        matchesABlock = true;
                        return;
                    }
                })
                if(!matchesABlock){
                    return false;
                }
            }

        }
        return true;
    }
    matchItem(item:any):boolean{
        if(this.rawTargetData.type){

            if(_.isString(this.rawTargetData.block)){
                if(item.type != this.rawTargetData.item){
                    return false;
                }
            }else{
                let matchesABlock = false;
                this.rawTargetData.item.forEach((_item)=>{
                    if(item.type == _item.type){
                        matchesABlock = true;
                        return;
                    }
                })
                if(!matchesABlock){
                    return false;
                }
            }
        }
        return true;
    }
    matchEntity(entity:any):boolean{



        if(this.rawTargetData.entityType){

            if(!_.isArray(this.rawTargetData.entityType)){
                if(this.rawTargetData.entityType == '*') {
                    if (entity.entityType != this.rawTargetData.entityType) {
                        return false;
                    }
                }
            }else{
                let matchesABlock = false;
                this.rawTargetData.entityType.forEach((_entityType)=>{
                    if(entity.entityType == _entityType){
                        matchesABlock = true;
                        return;
                    }
                })
                if(!matchesABlock){
                    return false;
                }
            }
        }


        if(this.rawTargetData.meta_blockId){

            let matchesABlock = false;
            this.rawTargetData.meta_blockId.forEach((_itemId)=>{
                if(
                    entity.entityType == 2 && //2 is a dropped item
                    entity.metadata[6]._itemId == _itemId
                ){
                    matchesABlock = true;
                    return;
                }
            })
            if(!matchesABlock){
                return false;
            }

        }
        if(this.rawTargetData.is_holding){
            let matchesABlock = false;
            this.rawTargetData.is_holding.forEach((_itemId)=>{
                if(
                    //2 is a dropped item
                    entity.heldItem &&
                    entity.heldItem.type == _itemId
                ){
                    matchesABlock = true;
                    return;
                }
            })
            if(!matchesABlock){
                return false;
            }
        }

        if(this.rawTargetData.mobType){
            if(!entity.mobType || entity.mobType != this.rawTargetData.mobType){
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

            let delta = this.node.brain.bot.entity.position.distanceTo(entity.position);
            return delta;
        })
        return results;
    }

    /**
     * Finds a block that is similar to the
     * @returns {any}
     */
    findBlock(options?:any):Array<any>{
        options = options || {};
        if(!this.rawTargetData.block){
            throw new Error(this.node.id + '- not valid');
        }
        return this.node.brain.bot.findBlockSync({
            point: this.node.brain.bot.entity.position,
            matching: this.rawTargetData.block,
            maxDistance: options.maxDistance || this.rawTargetData.maxDistance || 20,
            count: options.count || this.rawTargetData.count || 1,
        })
    }
    findInventory(options?:any):Array<any>{
        switch(this.rawTargetData.type){
            case('recipe'):
                return this.findRecipeInInventory(options);
            //break;
            default:
        }
        let results = [];
        this.node.brain.bot.inventory.slots.forEach((inventorySlot)=>{
            if(!inventorySlot){
                return false;
            }

            let type:any = 'block';
            switch(this.rawTargetData.type){
                case('block'):
                    type = this.rawTargetData.block;
                break;
                default:
                    type = this.rawTargetData.item;
            }
            if(_.isArray(type)){
                let match = false;
                (<[any]>type).forEach((_type)=>{
                    if (inventorySlot.type == _type) {
                        match = true;
                    }
                });
                if(!match){
                    return false;
                }
            }else {
                if (inventorySlot.type != type) {
                    return false;
                }
            }
            results.push(inventorySlot);

        })
        return results;
    }
    findRecipeInInventory(options?:any):Array<any>{
        switch(this.rawTargetData.type){
            case('recipe'):
                //We are good
            break;
            default:
                throw new Error("Not a valid target type for `findRecipeInInventory`: " + this.rawTargetData.type)
        }
        //Get requirements
        let minecraftData = MinecraftData(config.get('minecraft.version'));

        let recipes = [];


        if(!_.isArray(this.rawTargetData.recipe)){
            this.rawTargetData.recipe = [this.rawTargetData.recipe];
        }
        (<[any]>this.rawTargetData.recipe).forEach((_recipeItem)=>{
            if(!minecraftData.recipes[_recipeItem]){
                return console.error("Recipe Not found: ", _recipeItem);
            }
            minecraftData.recipes[_recipeItem].forEach((_recipePossibility)=>{
                let requiredItemData = {};
                _recipePossibility.inShape.forEach((row)=>{
                    row.forEach((itemId)=> {
                        requiredItemData[itemId] = requiredItemData[itemId] || 0;
                        requiredItemData[itemId] += 1;
                    });
                })
                recipes.push({
                    produces:_recipeItem,
                    requires:requiredItemData
                });
            })

        });



        let results = [];
        recipes.forEach((recipeData)=>{
            let satisfied = {};
            Object.keys(recipeData.requires).forEach((itemId)=>{
                satisfied[itemId] = false;
            })
            this.node.brain.bot.inventory.slots.forEach((inventorySlot)=>{
                if(!inventorySlot){
                    return false;
                }
                if(
                    recipeData.requires[inventorySlot.type]
                ){
                    satisfied[inventorySlot.type] =  inventorySlot.count / recipeData.requires[inventorySlot.type];
                }


                results.push(inventorySlot);

            })
            let produces = null;
            Object.keys(satisfied).forEach((itemId)=>{

                if(Math.floor(satisfied[itemId]) > 0){
                    produces = satisfied[itemId];
                }
            })

        })

        return results;
    }
}
export { InputNodeTarget }