class NodeDependantRelationship{
    protected rawRelationshipData:any = null;
    protected parentNode:NodeBase = null;
    protected dependantNode:NodeBase = null;
    constructor(options:any){
        this.rawRelationshipData = options.rawRelationshipData;
        this.parentNode = options.parentNode;
        this.dependantNode = options.dependantNode;
    }

}