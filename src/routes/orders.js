const express=require('express');
const Order=require('../models/Order')

const OrderStatus={
    PAID:"Paid",
    PAYMENT_FAILED:"Payment_Failed"
}

const router=express.Router();
router.post('/',async(req,res,next)=>{
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
    return res.json(order);
})

