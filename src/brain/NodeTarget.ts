import { NodeBase } from './nodes/NodeBase'
import * as _ from 'underscore'
import * as vec3 from 'vec3';
import * as MinecraftData from 'minecraft-data';
import * as config from 'config'
class NodeTarget{
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
    matchBlock(block:any, options?:any):boolean{
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

       if(
           !options.skipMatchPosition &&
           !this.matchPosition(block.position)
       ){
           return false;
       }


        return true;
    }
    matchPosition(position){

       let newPosition = this.rawTargetData.position;//this.translatePositionDeltaRange()
        if(!newPosition){
            return true;
        }

        if(
            !(
                this.node.brain.bot.entity.position.x + newPosition.xDelta.min < position.x &&
                this.node.brain.bot.entity.position.x + newPosition.xDelta.max > position.x  &&

                this.node.brain.bot.entity.position.y + newPosition.yDelta.min < position.y &&
                this.node.brain.bot.entity.position.y + newPosition.yDelta.max > position.y &&

                this.node.brain.bot.entity.position.z + newPosition.zDelta.min < position.z &&
                this.node.brain.bot.entity.position.z + newPosition.zDelta.max > position.z
            )
        ){
            return false;
        }

        return true;
    }
    translatePositionDeltaRange(){
        if(!this.rawTargetData.position){
            return null;
        }

        if(
            !(
                this.rawTargetData.position.xDelta &&
                this.rawTargetData.position.yDelta &&
                this.rawTargetData.position.zDelta
            )
        ) {
            throw new Error("Invalid `position` data");
        }
        let newPosition = _.clone(this.rawTargetData.position);
        let fortyFiveDegrees:number = Math.PI / 4;
        let facing = null;
        let rotation = null;
        if(this.node.brain.bot.entity.yaw > 0 - fortyFiveDegrees && this.node.brain.bot.entity.yaw <=  fortyFiveDegrees){
            //They are facing north?
            facing = 'n';
            rotation = 0;
        }else if(this.node.brain.bot.entity.yaw >  fortyFiveDegrees  || this.node.brain.bot.entity.yaw <= fortyFiveDegrees * 3){
            //They are facing east
            facing = 'e';
            rotation = fortyFiveDegrees * 2;
        }else if(this.node.brain.bot.entity.yaw >  fortyFiveDegrees * 3 || this.node.brain.bot.entity.yaw <= fortyFiveDegrees * 5){
            //They are facing south
            facing = 's';
            rotation = fortyFiveDegrees * 4;
        }else if(this.node.brain.bot.entity.yaw >  fortyFiveDegrees * 5 || this.node.brain.bot.entity.yaw <= fortyFiveDegrees * 7){
            //They are facing west
            facing = 'w';
            rotation = fortyFiveDegrees * 6;
        }
        //We only need to rotate x and z
        let translatePoint = (property)=>{
            let tanMin = this.rawTargetData.position.zDelta[property] / this.rawTargetData.position.xDelta[property];
            let hypotinuse = Math.sqrt(Math.pow(this.rawTargetData.position.zDelta[property], 2) + Math.pow(this.rawTargetData.position.xDelta[property], 2))
            let aTanMin = Math.atan(tanMin);
            newPosition.zDelta[property] = Math.sin(aTanMin + rotation) * hypotinuse;
            newPosition.xDelta[property] = Math.cos(aTanMin + rotation) * hypotinuse;

        }
        translatePoint('min');
        translatePoint('max');

        if(
            newPosition.zDelta.min > newPosition.zDelta.max
        ){
            let tmpMin = newPosition.zDelta.min;
            newPosition.zDelta.min = newPosition.zDelta.max;
            newPosition.zDelta.max = tmpMin;
        }

        if(
            newPosition.xDelta.min > newPosition.xDelta.max
        ){
            let tmpMin = newPosition.xDelta.min;
            newPosition.xDelta.min = newPosition.xDelta.max;
            newPosition.xDelta.max = tmpMin;
        }
        return newPosition;
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
                    if(_.isObject(_item)){
                        if(item.type == _item.type){
                            matchesABlock = true;
                            return;
                        }
                    }else{
                        if(item.type == _item){
                            matchesABlock = true;
                            return;
                        }
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
                    if(
                        entity.type/*entityType*/ == _entityType ||
                        entity.entityType == _entityType
                    ){
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
            if(!_.isArray(this.rawTargetData.mobType)) {
                if (!entity.mobType || entity.mobType != this.rawTargetData.mobType) {
                    return false;
                }
            }else{
                let matched = false;
                this.rawTargetData.mobType.forEach((mobType)=>{
                    if (!entity.mobType || entity.mobType != mobType) {
                        matched = true;
                    }
                })
                if(!matched){
                    return false;
                }
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
        if(!this.matchPosition(entity.position)){
            return false;
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
            //throw new Error(this.node.id + '- not valid');
        }
        //TODO: Rewrite
        let newPosition = this.rawTargetData.position;//this.translatePositionDeltaRange()
        if(!newPosition){
            throw new Error(this.node.id + '- no valid `positionDeltaRange`');
        }
        let results = [];
        for(let x = this.node.brain.bot.entity.position.x + newPosition.xDelta.min; x <= this.node.brain.bot.entity.position.x + newPosition.xDelta.max; x++){
            for(let y = this.node.brain.bot.entity.position.y + newPosition.yDelta.min; y <= this.node.brain.bot.entity.position.y + newPosition.yDelta.max; y++){
                for(let z = this.node.brain.bot.entity.position.z + newPosition.zDelta.min; z <= this.node.brain.bot.entity.position.z + newPosition.zDelta.max; z++){
                    let block = this.node.brain.bot.blockAt(
                        new vec3(x, y, z)
                    );
                    if(
                        this.matchBlock(
                            block, {
                                skipMatchPosition:true
                            }
                        )
                    ){
                        results.push(block);
                    }
                }
            }
        }
        return results;
        /*return this.node.brain.bot.findBlockSync({
            point: this.node.brain.bot.entity.position,
            matching: this.rawTargetData.block,
            maxDistance: options.maxDistance || this.rawTargetData.maxDistance || 20,
            count: options.count || this.rawTargetData.count || 20,
        })*/
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
                    let _meta_type = null;
                    if(_.isString(_type) && _type.indexOf(':') !== 0){
                        let parts = _type.split(':');
                        _type = parts[0];
                        _meta_type = parts[1];
                    }
                    if (inventorySlot.type == _type) {
                        if(!_meta_type){
                            match = true;
                        }else if(_meta_type == inventorySlot.metadata){
                            match = true;
                        }

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

        if(!_.isArray(this.rawTargetData.recipe)){
            this.rawTargetData.recipe = [this.rawTargetData.recipe];
        }
        let recipes = [];
        this.rawTargetData.recipe.forEach((recipe)=>{
            let _recipes = this.node.brain.app.bot.recipesFor(
                recipe,
                this.rawTargetData.metadata || null,
                this.rawTargetData.minResultCount || null,
                /*this.rawTargetData.craftingTable || */null//TODO: Search for touchable crafting tables
            )
            recipes = _recipes.concat(recipes);
        });
        return recipes;
     /*   let results = [];
        recipes.forEach((recipe)=>{
this.findInventory({

})
        })
        return recipes;*/

    }
}
export { NodeTarget }