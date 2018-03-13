import * as _ from 'underscore'
import { NodeBase } from './nodes/NodeBase'
import { OutputNodeBase } from './nodes/OutputNodeBase'
import { InputNodeBase } from './nodes/InputNodeBase'
import { MiddleNodeBase } from './nodes/MiddleNodeBase'
import {NodeEvaluateResult} from "./NodeEvaluateResult";
import * as debug from 'debug'
import * as config from 'config'
class Brain{
    protected _debug:any = null;
    protected _firedOutpuCount:number = 0;
    protected currTick:number =0;
    protected rawBrainNodes:any = null;
    protected _app:any/*App*/ = null;
    protected _nodes:any = {};
    constructor(options:any){
        this._debug = debug('chaoscraft.brain');
        this.rawBrainNodes = options.rawBrainNodes;
        this._app = options.app;
        this.import();

        /*setInterval(()=>{
            //TEST
            let outputNode = null;
            this.eachNodeSync(
                (_outputNode)=>{
                    outputNode = _outputNode;
                },
                'output'
            )

            this.app.socket.sendFireOutputNode({
                node: outputNode.id,
                results: null,
                duration: 100
            })
        }, 5000)*/
    }
    get debug():any{
        return this._debug;
    }
    get firedOutpuCount():number{
        return this._firedOutpuCount;
    }
    get nodes():Array<NodeBase>{
        return this._nodes;
    }
    get bot():any{
        return this._app.bot;
    }
    get app():any{
        return this._app;
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
        let tickStartDate = new Date();
        //console.log("ProcessTick:", this.currTick);
        let firingOutputNodes:Array<NodeEvaluateResult> = [];
        this.eachNodeSync(
            (outputNode)=>{
                if(outputNode.errorThresholdHit){
                    return;
                }
                let startDate = new Date().getTime();
                try {
                    let evaluateResult = outputNode.evaluate();
                    if (evaluateResult.score >= 1) {
                        firingOutputNodes.push(evaluateResult);
                    }
                    let duration = (new Date().getTime() - startDate) / 1000;
                    //console.log(this.app.identity.username + " - OUTPUTNODE EVAL:", outputNode.id, ' - ', duration, ' score: ', evaluateResult.score);
                }catch(err){
                    console.error(this.app.identity.username + ' - ERROR - Firing OutputNode: ' + outputNode.id , err.message, err.stack);
                }
            },
            'output'
        )

        let successfulFiredCount = 0;
        firingOutputNodes.forEach((evaluateResult:NodeEvaluateResult)=>{
            if(successfulFiredCount > config.get('brain.maxOutputsFiredPerTick')){
                return;
            }
            let startDate = new Date().getTime();
            let node = <OutputNodeBase>evaluateResult.node;
            let activateResult = node.activate({
                results:evaluateResult.results
            });
            let duration = (new Date().getTime() - startDate)/1000;
            if(!activateResult){
                if(node.errorThresholdHit){

                    return this.app.socket.emit(
                        'client_node_error_threshold_hit',
                        {
                            node: evaluateResult.node.id,
                            duration: duration
                        }
                    );
                }
            }
            successfulFiredCount += 1;//This is temporary for this tick
            this._firedOutpuCount += 1;//This is longer term

            this.app.socket.sendFireOutputNode({
                node: evaluateResult.node.id,
                results: evaluateResult.results,
                duration: duration
            })
            //console.log(this.app.identity.username + "ACTIVATE OUTPUT:", evaluateResult.node.type, /*"RESULTS:", evaluateResult.results,*/ ' - ', duration);
        })
        console.log(this.app.identity.username + " Process Tick Complete: ", this.currTick, ' - Duration:' +  (new Date().getTime() / tickStartDate.getTime()) / 1000 );




    }
}
export { Brain }