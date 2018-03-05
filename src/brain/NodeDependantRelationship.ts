import { NodeBase } from './nodes/NodeBase'
import {NodeEvaluateResult} from "./NodeEvaluateResult";
class NodeDependantRelationship{
    rawRelationshipData:any = null;
    _parentNode:NodeBase = null;
    _dependantNode:NodeBase = null;
    constructor(options:any){
        this.rawRelationshipData = options.rawRelationshipData;
        this._parentNode = options.parentNode;
        this._dependantNode = options.dependantNode;
    }
    get parentNode():NodeBase{
        return this._parentNode;
    }
    get dependantNode():NodeBase{
        return this._dependantNode;
    }
    get weight():number{
        return this.rawRelationshipData.weight;
    }
    public evaluate():NodeEvaluateResult{
        return this._dependantNode.evaluate();
    }

}
export { NodeDependantRelationship }