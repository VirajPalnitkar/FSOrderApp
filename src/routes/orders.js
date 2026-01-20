const express=require('express');
const Order=require('../models/Order')
const {charge}=require('../services/paymentProvider')
const idempotency=require('../midlleware/idempotency')
const generateETag=require('../utils/etag')

const OrderStatus={
    PAID:"Paid",
    PAYMENT_FAILED:"Payment_Failed"
}

const router=express.Router();
router.post('/',idempotency(),async(req,res,next)=>{
    try{
        const {userId,amount,currency}=req.body;
        if(!userId || !amount || !currency || typeof amount!=='number' || amount<0)
            return res.status(400).json({error:"Invalid Input"});
        const order=await Order.create({userId,amount,currency});
        try{
            const payment=await charge({orderId:order._id,amount,currency});
            order.status=OrderStatus.PAID;
            order.payment=payment;
            await order.save();
            return res.status(201).json(order);
        }
        catch(e){
            order.status=OrderStatus.PAYMENT_FAILED;
            await order.save();
            return res.status(502).json({error:"Payment failed"});
        }
    }
    catch(e){
        next(new Error("Order not placed"));
    }
})

router.get('/',async(req,res)=>{
    const orders=await Order.find({});
    return res.status(200).json({orders});
})

router.get('/:id',async(req,res)=>{
    const order=await Order.findById(req.params.id);
    if(!order) return res.status(404).json({error:"Not Found"});
    const etag=generateETag(order);
    //set method used to set http headers
    res.set("ETag",etag);
    //no-cache meaning  You may cache this response, but you MUST revalidate before using it
    res.set("Cache-Control","no-cache");
    const clientETag=req.headers["if-none-match"];
    if(clientETag===etag)
        return res.status(304).end();
    return res.json(order);
})

//inner doc (payment) not changing
router.put("/:id",async(req,res)=>{
    const {userId,currency,status,amount}=req.body;
    if(!currency || !userId || amount===undefined || typeof amount!=='number' || amount<=0){
        return res.status(400).json({
            error:"Information insufficient"
        })
    }
    try{
        const order=await Order.findById(req.params.id);
        if(!order)
            return res.status(404).json({error:"Order not found"});
        order.userId=userId;
        order.amount=amount;
        order.currency=currency;
        if(status)
            order.status=status;
            await order.save();
            return res.status(200).json(order);
    }
    catch(e){
        return res.status(500).json({error:"Server Error"});
    }
})

//inner doc still not changing
router.patch("/:id",async(req,res)=>{
    try{
        const allowed=["amount","currency","status"];
        const updates={};
        for(const key of allowed){
            if(req.body[key]!==undefined)
                updates[key]=req.body[key];
        }
        //by default, the old doc is returned
        //by using new:true, the updated doc is returned
        const order=await Order.findByIdAndUpdate(req.params.id,
            updates,{
                new:true,
                //Explicit mention needed for update version
                //Dont use findByIdAndUpdate when hooks are involved
                runValidators:true
            }
        );
        if (!order) 
            return res.status(404).json({ error: "Not found" }); 
        return res.json(order);
    }
    catch(e){
        console.log(e.message)
        res.status(500).json({ error: "Server error" });
    }
})

router.delete("/:id", async (req, res) => { 
  try { 
    const order = await Order.findByIdAndDelete(req.params.id); 
    //It returns the deleted document if it exists
    if (!order) return res.status(404).json({ error: "Not found" }); 
    res.json({ message: "Deleted" }); 
  } catch (err) { 
    res.status(500).json({ error: "Server error" }); 
  } 
}); 

module.exports=router;