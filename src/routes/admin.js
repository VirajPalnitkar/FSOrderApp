const express=require('express');
const {getBehaviour,setBehaviour}=require('../services/paymentProvider')

const router=express.Router();

router.get("/payment-behaviour",(req,res)=>{
    res.json(getBehaviour());
})

router.post("/payment-behaviour",(req,res)=>{
    setBehaviour(req.body||{});
    res.json(getBehaviour());
})

module.exports=router;