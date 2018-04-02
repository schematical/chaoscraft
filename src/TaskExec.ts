class TaskExec{
    protected _app:any = null;
    protected startFun:any = null;
    protected testFun:any = null;
    protected finishFun:any = null;
    protected maxTicks:any = null;
    protected priority:number = null;
    constructor(options){
        this.startFun = options.startFun || null;
        this.testFun = options.testFun || null;
        this.finishFun = options.finishFun || null;
        this.maxTicks = options.maxTicks || null;
        this.priority = options.priority || null;
        if(!options.app){
            this._app = options.app
        }
    }
}
export { TaskExec }