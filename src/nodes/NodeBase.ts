import {Brain} from '../Brain'
import { NodeDependantRelationship } from '../NodeDependantRelationship'

class NodeBase{
    protected brain:Brain = null;
    protected rawNode:any = null;
    protected dependantRelationships:Array<NodeDependantRelationship> = [];
    constructor(options:any){
        if(!options.brain){
            throw new Error("Need to pass in the main brain");
        }
        this.brain = options.brain;
        if(!options.rawNode){
            throw new Error("Missing `rawNode` data");
        }
        this.rawNode = options.rawNode;
        if(!this.rawNode.id){
            console.error(this.rawNode);
            throw new Error("Missing `this.rawNode.id`");
        }
    }
    get id():string{
        return this.rawNode.id;
    }

    /**
     * This iterates through and links all dependants
     */
    public attachDependants(){
        if(!this.rawNode.dependants){
            return;
        }
        this.rawNode.dependants.forEach((rawRelationshipData)=>{
            let dependantNode = this.brain.findNodeById(rawRelationshipData.id);
            let dependantRelationship = new NodeDependantRelationship({
                parentNode: this,
                dependantNode: dependantNode,
                rawRelationshipData: rawRelationshipData
            });
            this.dependantRelationships.push(dependantRelationship)
        })


    }
}
export { NodeBase }