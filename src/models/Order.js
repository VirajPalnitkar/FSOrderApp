const mongoose=require('mongoose');

const PaymentSchema=new mongoose.Schema({
    provider:String,
    paymentID:String,
    amount:Number,
    currency:String,
    chargedAt:Date
},{
    _id:false
});


const OrderSchema=new mongoose.Schema({
    userId:String,
    amount:Number,
    currency:String,
    status:{
        type:String,
        enum:["Created","Paid","Payment_Failed"],
        default:"Created"
    },
    payment:PaymentSchema
},{timestamps:true});

module.exports=mongoose.model("Order",OrderSchema);
