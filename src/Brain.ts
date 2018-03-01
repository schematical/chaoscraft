import * as _ from 'underscore'
import { NodeBase } from './nodes/NodeBase'
import { OutputNodeBase } from './nodes/OutputNodeBase'
import { InputNodeBase } from './nodes/InputNodeBase'
import { MiddleNodeBase } from './nodes/MiddleNodeBase'
class Brain{
    protected currTick:number =0;
    protected rawBrainNodes:any = null;
    protected _app:any/*App*/ = null;
    protected _nodes:any = {};
    constructor(options:any){
        this.rawBrainNodes = options.rawBrainNodes;
        this._app = options.app;
        this.import();
    }
    get nodes():Array<NodeBase>{
        return this._nodes;
    }
    get bot():any{
        return this._app.bot;
    }
    /**
     * This starts building the node structure from the `rawBrainNodes`
     */
    protected import(){
        Object.keys(this.rawBrainNodes).forEach((key)=>{
            let currRawNode = this.rawBrainNodes[key];
            currRawNode.id = key;
            let currNode = null;
            switch(currRawNode.base_type) {
                case('output'):

                    currNode = new OutputNodeBase({
                        rawNode: currRawNode,
                        brain: this
                    })
                break;
                case('input'):
                    currNode = new InputNodeBase({
                        rawNode: currRawNode,
                        brain: this
                    })
                break;
                case('middle'):
                    currNode = new MiddleNodeBase({
                        rawNode: currRawNode,
                        brain: this
                    })
                break;
                default:
                    throw new Error("Invalid `Node.base_type`:" + currRawNode.base_type)
            }
            this._nodes[currNode.id] = currNode;


        })
        this.eachNodeSync((node:NodeBase)=>{
            node.attachDependants();
        })
    }

    /**
     * Finds a Node by its `id`
     * @param id
     * @returns {NodeBase|null}
     */
    findNodeById(id):NodeBase{
        return this.nodes[id] || null;
    }

    /**
     * Iterates through all nodes and passes them to the function
     * @param fun
     * @param filter - If a string is passed in the node will filter by `base_type` othewise it if a function is passed in it will use the results of that function to determine if the node is run through the first function
     */
    eachNodeSync(fun, filter?){
        Object.keys(this.nodes).forEach((id)=>{
            if(filter){
                if(_.isString(filter)){
                    //We will assume this means the node's `base_type`
                    if(filter != this.nodes[id].base_type){
                        return false;
                    }
                }else if(_.isFunction(filter)){
                    if(!filter(this.nodes)){
                        return false;
                    }
                }else{
                    throw new Error("No a valid `filter` passed in")
                }
            }
            return fun(this.nodes[id]);
        })
    }

    /**
     * This evaluates all nodes in the Brain and decides which actions to take
     */
    public processTick():void{
        this.currTick += 1;
        let firingOutputNodes:Array<OutputNodeBase> = [];
        this.eachNodeSync(
            (outputNode)=>{
                let score = outputNode.evaluate();
                if(score >= 1){
                    firingOutputNodes.push(outputNode);
                }
            },
            'output'
        )


        firingOutputNodes.forEach((outputNode:OutputNodeBase)=>{
            outputNode.activate();
        })

    }
}
export { Brain }