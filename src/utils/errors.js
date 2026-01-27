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

class CircuitBreakerOpenError extends Error {
  constructor() {
    super("Service temporarily unavailable");
    this.name = "CircuitBreakerOpenError";
    this.statusCode = 503;
  }
}


module.exports={BulkHeadError,PaymentFailError,CircuitBreakerOpenError};