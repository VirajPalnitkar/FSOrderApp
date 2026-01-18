const state={failureRate:0,minDelayMs:50,maxDelayMs:150};

function sleep(ms){
    return new Promise(r=>setTimeout(r,ms))
}

async function charge({orderId,amount,currency}){
    //delay between min and max , both being inclusive
    const delay = Math.floor(Math.random() * (state.maxDelayMs - state.minDelayMs + 1)) + state.minDelayMs; 
    await sleep(delay);
    if(Math.random()<state.failureRate){
        const err=new Error("Payment provider failure");
        err.code="PAYMENT_PROVIDER_DOWN";
        throw err;
    }
    return {
        provider:"Mock_Pay",
        paymentId:`pay_${orderId}_${Date.now()}`,
        amount,
        currency,
        chargedAt:new Date()
    };
}

function setBehaviour(b){
    //No validation added
    //Must be added in the future
    Object.assign(state,b);
}

function getBehaviour(){
    //returning a copy as we don't want someone to tamper outside with the reference
    //of the actual object being passed
    return {...state};
}

module.exports={setBehaviour,getBehaviour,charge};