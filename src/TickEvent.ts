class TickEvent{
    protected _type:string = null;
    protected _data:Array<any> = null;
    constructor(options:any){
        this._type = options.type;
        this._data = options.data;
    }
    get type():string{
        return this._type;
    }
    get data():Array<any>{
        return this._data;
    }
}
export { TickEvent }