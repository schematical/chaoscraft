/**
 * Created by user1a on 3/1/18.
 */
import { NodeBase } from './nodes/NodeBase'
class NodeEvaluateResult{
    protected _score:number = 0;
    protected _results:Array<any> = null;
    protected _node:NodeBase = null;
    constructor(options:any){
        this._score = options.score;
        this._results = options.results;
        this._node = options.node;
    }
    get score():number{
        return this._score;
    }
    get results():Array<any>{
        return this._results;
    }
    get node():NodeBase{
        return this._node;
    }
}
export { NodeEvaluateResult }