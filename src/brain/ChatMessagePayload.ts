
import * as _ from 'underscore';
class ChatMessagePayload{
    static D:string = '||';
    public broadcaster:string;
    public words:[string];
    public target:string;
    public action:string;
    constructor(options){
        if(_.isString(options)){
            this.parseMessage(options);
            return;
        }

        this.action = options.action || 'chat';
        this.target = options.target || null;
        this.words = options.words;

        /*
         action:'chat',
         target: target.username,
         words:[this.rawNode.target.word]
         */


    }
    parseMessage(message){
        let parts = message.split(ChatMessagePayload.D);
        this.action = parts[0];
        switch(this.action){
            case('chat'):


                if(parts[1].substr(0,1) == '@'){
                    this.target = parts[1].substr(1);
                    this.words = parts[2].split(' ');
                }else{
                    this.target = null;
                    this.words = parts[1].split(' ');
                }
            break;
            default:
                //Do nothing

        }

    }
    toString(){
        let parts = [];
        parts[0] = this.action;
        if(this.target){
            parts[1] = '@' + this.target;
            parts[2] = this.words.join(' ');
        }else{
            parts[1] = this.words.join(' ');
        }


        return parts.join(ChatMessagePayload.D);
    }
}
export { ChatMessagePayload }