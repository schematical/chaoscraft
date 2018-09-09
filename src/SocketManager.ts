/**
 * Created by user1a on 3/5/18.
 */
import * as io from 'socket.io-client'
import * as config from 'config'
import * as debug from 'debug'
import * as vec3 from 'vec3'
class SocketManager{
    protected debug = null;
    protected app: any = null;
    protected socket:SocketIOClient.Socket = null;
    protected isObserved:boolean = false;//TODO: Change this to false
    protected lastPingTimestamp:number = null;

    constructor(options:any){

        this.app = options.app;
        this.debug = debug('chaoscraft.socket');
        let host = config.get('socket.host');
        console.log("Socket attempting to connect to: ", host);
        this.socket = io(host);
        this.debug("Setting Up Socket");
        this.socket.on('client_hello_response', (identity) => {
            console.log("client_hello_response", identity)
            this.app.identity = identity;
            this.app.end();
            //setTimeout(()=>{
                this.app.setupBrain();
            //}, 3000)

        });

        this.socket.emit('client_hello', {
            username: process.env.BOT_USERNAME || null,
            env: process.env.NODE_ENV
        });
        this.socket.on('request_handshake', ()=>{
            if(!this.app.identity){
                return;
            }
            this.socket.emit('client_handshake', {
                username: this.app.identity.username
            });
        })
        this.socket.on('client_start_observe', ()=>{
            this.isObserved = true;
        })
        this.socket.on('client_end_observe', ()=>{
            this.isObserved = false;
        })
        this.socket.on('client_ping', (data)=>{
            data.timestamp = data.timestamp || new Date().getTime();
            if(this.lastPingTimestamp && this.lastPingTimestamp == data.timestamp){
                return;
            }
            this.lastPingTimestamp = data.timestamp;
            this.app.pong();
        });
        this.socket.on('disconnect', ()=>{
            console.error("DISCONNECTED from the socket server!!!!!");
        });
        this.socket.on('connect', ()=>{
            console.error("CONNECTED from the socket server!!!!!");
            if(!this.app.identity){
                this.socket.emit('client_hello', {
                    username: process.env.BOT_USERNAME || null,
                    env: process.env.NODE_ENV
                });
            }
        });
        this.socket.on('map_nearby_request', (payload)=>{
            this.onMapNearbyRequest(payload);
        })
    }
    public on(eventType, callback){
        this.socket.on(eventType, callback);
    }
    debugEmit(eventType, payload){
        if(!this.isObserved){
            return;
        }
        return this.emit(eventType, payload);
    }
    emit(eventType, payload){
        this.socket.emit(eventType, payload);
    }
    sendFireOutputNode(payload){
        payload.username = this.app.identity.username;
        payload.results = [payload.results[0]]
        this.debugEmit('client_fire_outputnode', payload);
    }

    onMapNearbyRequest(payload:any){
        if(!this.app.bot.entity || !this.app.bot.entity.position){
            return;
        }
        let blockData:any = {};
        let range = 10;
        for(let x = Math.round(this.app.bot.entity.position.x) - range; x <=  Math.round(this.app.bot.entity.position.x) + range; x++){
            for(let y =  Math.round(this.app.bot.entity.position.y) - range; y <=  Math.round(this.app.bot.entity.position.y) + range; y++){
                for(let z =  Math.round(this.app.bot.entity.position.z) - range; z <=  Math.round(this.app.bot.entity.position.z) + range; z++){

                    blockData[x] = blockData[x] || {};
                    blockData[x][y] = blockData[x][y] || {};
                    let block = this.app.bot.blockAt(new vec3(x,y,z));
                    if(!block){
                        blockData[x][y][z] = null;
                        console.error("MIssing Block at:", x, y, z);
                    }else {
                        blockData[x][y][z] = {
                            type: block.type
                        }
                    }

                }
            }
        }
        /*let fs = require('fs');
        fs.writeFileSync('./test-world.json', JSON.stringify(blockData));
*/
        this.socket.emit('map_nearby_response', {
            username: this.app.bot.username,
            blockData:blockData
        });
    }

}
export { SocketManager }