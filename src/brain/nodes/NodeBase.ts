import {Brain} from '../Brain'
import { NodeDependantRelationship } from '../NodeDependantRelationship'
import {NodeEvaluateResult} from "../NodeEvaluateResult";

class NodeBase{
    protected _brain:Brain = null;
    protected rawNode:any = null;
    protected dependantRelationships:Array<NodeDependantRelationship> = [];
    constructor(options:any){
        if(!options.brain){
            throw new Error("Need to pass in the main brain");
        }
        this._brain = options.brain;
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
    get base_type():string{
        return this.rawNode.base_type;
    }
    get type():string{
        return this.rawNode.type;
    }
    get brain():Brain{
        return this._brain;
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
            if(!rawRelationshipData.weight){
                rawRelationshipData.weight = 1/this.rawNode.dependants.length;//TODO: This is kinda hacky
            }
            let dependantRelationship = new NodeDependantRelationship({
                parentNode: this,
                dependantNode: dependantNode,
                rawRelationshipData: rawRelationshipData
            });
            this.dependantRelationships.push(dependantRelationship)
        })


    }

    /**
     * This method goes through all dependants and sees what they evaluate to
     */
    public evaluate():NodeEvaluateResult{

        let score = 0;
        let highestScore = 0;
        let highestResult = null;

        this.eachDependantNodeSync((dependantRelationship:NodeDependantRelationship)=>{
            let evaluateResult:NodeEvaluateResult = dependantRelationship.evaluate();
            let weightedScore = evaluateResult.score * dependantRelationship.weight;
            score += weightedScore;
            if(weightedScore > highestScore){
                highestResult = evaluateResult.results
                highestScore = evaluateResult.score;
            }
        })
        //TODO: Combine Results by Score into a single array - Prob add type to results
        return new NodeEvaluateResult({
            score: score,
            results: highestResult,
            node: this
        });
    };
    activate(options){
        throw new Error("No `activate` method on InputBase")
    }
    /**
     * Iterates through each dependantNode in a Synchronous way
     * @param fun
     */
    public eachDependantNodeSync(fun){
        this.dependantRelationships.forEach((dependantRelationship:NodeDependantRelationship)=>{
            fun(dependantRelationship)
        })
    }
    public serialize(){
        return this.rawNode;
    }
}
export { NodeBase }