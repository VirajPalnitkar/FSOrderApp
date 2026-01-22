class BulkHeadError extends Error{
    constructor(){
        super("Bulkhead limit exceeded");
        this.name="BulkheadLimitError";
        this.statusCode=429;
    }
}

class PaymentFailError extends Error{
    constructor(){
        super("Payment failed")
        this.name="PaymentFailedError";
        this.statusCode=502
    }
}

module.exports={BulkHeadError,PaymentFailError};