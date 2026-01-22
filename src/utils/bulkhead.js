const {BulkHeadError}=require("./errors")
class BulkHead{
    constructor(limit){
        this.limit=limit;
        this.active=0;
    }
    async execute(task){
        if(this.active>=this.limit)
            throw new BulkHeadError();
        this.active++;
        try{
            return await task();
        }
        finally{
            this.active--;
        }
    }
}
module.exports=BulkHead;