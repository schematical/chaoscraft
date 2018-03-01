/**
 * Created by user1a on 2/28/18.
 */
import { NodeBase } from './NodeBase'
import { InputNodeTarget } from '../InputNodeTarget'
class InputNodeBase extends NodeBase{
    protected _target:InputNodeTarget = null;
    constructor (options){
        super(options);
        if(!this.rawNode.target){
            //IDK...
        }
        this._target = new InputNodeTarget({
            node:this,
            rawTargetData: this.rawNode.target
        });

    }

    evaluate():number{
        let score:number = 0;
        switch(this.type){
            case('canSeeEntity'):
                score = this.canSeeEntity();
            break;
            case('canSeeBlock'):
                score = this.canSeeBlock();
            break;
            case('chat'):
                score = this.chat();
            break;
            default:
                throw new Error("Invalid `InputNodeBase.type`: " + this.type)
        }
        return score;
    }


    /**
     * Returns a 1 or a 0 based on weither or not the player can see the position we are describing
     */
    canSeeEntity():number{
        let targetResults = this._target.find();

        if(targetResults.length == 0){
            return 0;
        }

    }

    canSeeBlock():number{
        let targetResults:Array<any> = this._target.find();
        if(targetResults.length == 0){
            return 0;
        }
    }

    chat():number{

    }
}
export { InputNodeBase }