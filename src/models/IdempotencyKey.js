const mongoose=require('mongoose');

const IdempotencyKeySchema=new mongoose.Schema({
    key:String,
    method:String,
    path:String,
    userId:String,
    requestHash:String,
    status:{
        type:String,
        enum:["IN_PROGRESS","COMPLETED"],
        default:"IN_PROGRESS"
    },
    responseStatus:Number,
    responseBody:mongoose.Schema.Types.Mixed,
    createdAt:{
        type:Date,
        default:Date.now()
    }
})

//Same action is identified uniquely by all these given parameters 
//and not by the key solely as there may be multiple methods that the 
//user may call at various paths. Each of them may have different intent
IdempotencyKeySchema.index({key:1,method:1,path:1,userId:1},{unique:true})
IdempotencyKeySchema.index({createdAt:1},{expireAfterSeconds:60*60*24})

module.exports=mongoose.model("IdempotencyKey",IdempotencyKeySchema);