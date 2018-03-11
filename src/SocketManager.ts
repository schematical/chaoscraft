/**
 * Created by user1a on 3/5/18.
 */
import * as io from 'socket.io-client'
import * as config from 'config'
import * as debug from 'debug'
class SocketManager{
    protected debug = null;
    protected app: any = null;
    protected socket:SocketIOClient.Socket = null;
    protected isObserved:boolean = true;//TODO: Change this to false
    constructor(options:any){
        this.app = options.app;
        this.debug = debug('chaoscraft.socket');
        this.socket = io(config.get('socket.host'));
        this.debug("Setting Up Socket");
        this.socket.on('client_hello_response', (identity) => {
            console.log("client_hello_response", identity)
            this.app.identity = identity;
            this.app.end();
            this.app.setupBrain()
        });
        this.socket.emit('client_hello', {
            username: process.env.BOT_USERNAME || null
        });
        this.socket.on('client_start_observe', ()=>{
            this.isObserved = true;
        })
        this.socket.on('client_end_observe', ()=>{
            this.isObserved = false;
        })
        this.socket.on('client_ping', ()=>{
            this.app.pong();
        });
    }
    public on(eventType, callback){
        this.socket.on(eventType, callback);
    }
    emit(eventType, payload){
        this.socket.emit(eventType, payload);
    }
    sendFireOutputNode(payload){
        this.socket.emit('client_fire_outputnode', payload);
    }
}
export { SocketManager }