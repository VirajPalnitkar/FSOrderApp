function generateETag(order){
    //updatedAt is an object, so we need string for stable tag generation and hence we use getTime fn
    return `"order"-${order._id}-${order.updatedAt.getTime()}`;
}
module.exports=generateETag;