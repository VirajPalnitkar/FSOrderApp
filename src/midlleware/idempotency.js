const crypto=require('crypto')
const IdempotencyKey=require('../models/IdempotencyKey')

//required because objects are unordered
//{2:1,3:2} and {3:2,2:1} are same but when converted directly to string
//The hash will be different and it will flag data change even though the data was same
function stableStringify(obj){
    if(obj===null || typeof obj!='object')
        return JSON.stringify(obj);
    if(Array.isArray(obj))
        return "["+obj.map(stableStringify).join(',')+']';
    const keys=Object.keys(obj).sort();
    return "{"+keys.map(k=>{
        return JSON.stringify(k)+":"+stableStringify(obj[k])
    }).join(",")+"}";
}

function hash(obj){
    //creating the object
    const hashObject=crypto.createHash('sha256');
    //update is usedd to feed the data to object
    //must be string, multiple data items can be given with multiple calls to update
    return hashObject.update(stableStringify(obj)).digest('hex');
    //digest produces the output and destroys the object. hex specifies the output type
}

module.exports=function idempotency(){
    return async function(req,res,next){
        const key=req.header("Idempotency-Key");
        if(!key)
            return res.status(400).json({error:"Missing Idempotency Key"});
        const filter={
            key,
            method:req.method,
            path:req.baseUrl+req.path,
            userId:req.body.userId
        }
        const reqHash=hash(req.body);
        let record=await IdempotencyKey.findOne(filter);
        if(record){
            //When payload has been tampered with for the same req
            //409 status code represents conflict
            if(record.requestHash!==reqHash)
                return res.status(409).json({error:"Payload mismatch for idempotency key"});
            //When the req has been completed
            if(record.status==="COMPLETED")
                return res.status(record.responseStatus).json(record.responseBody)
            //202 Accepted. Means Request accepted, but processing is not finished
            return res.status(202).json({status:"IN_PROGRESS"})
        }
        await IdempotencyKey.create({...filter,requestHash:reqHash});
        //Storing the original res.json fn with the correct this binding
        const originalJson=res.json.bind(res);
        res.json=async(body)=>{
            await IdempotencyKey.updateOne(filter,{
                status:"COMPLETED",
                responseStatus:res.statusCode,
                responseBody:body
            })
            return originalJson(body);
        };
        next();
    };
}