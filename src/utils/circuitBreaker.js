const {CircuitBreakerOpenError, BulkHeadError}=require('./errors')
class CircuitBreaker{
    constructor({failureThreshold=3,resetTimeout=10000}){
        this.failureThreshold=failureThreshold;
        this.resetTimeout=resetTimeout;
        this.failureCount=0;
        this.state="CLOSED";
        this.nextAttempt=Date.now();
    }
    async execute(action){
        if(this.state==="OPEN"){
            if(Date.now()>this.nextAttempt){
                this.state="HALF_OPEN";
            }
            else
                throw new CircuitBreakerOpenError("Circuit breaker is open");
        }
        try{
            const result=await action();
            this.success();
            return result;
        }
        catch(e){
            if(!(e instanceof BulkHeadError))
            this.failure();
            throw e;
        }
    }
    success(){
        this.failureCount=0;
        this.state="CLOSED";
    }
    failure(){
        if (this.state === "HALF_OPEN") {
            this.state = "OPEN";
            this.nextAttempt = Date.now() + this.resetTimeout;
            return;
        }
        this.failureCount++;
        if(this.failureCount>=this.failureThreshold){
            this.state="OPEN";
            this.nextAttempt=Date.now()+this.resetTimeout;
            console.log("Circuit breaker open")
        }
    }
}

module.exports=CircuitBreaker;