// const axios = require("axios");

// const payload = {
//   userId: "123",
//   amount: 500,
//   currency: "INR"
// };

// async function sendRequest(i) {
//   try {
//     const res = await axios.post("http://localhost:3000/orders", payload, {
//       headers: {
//         "Idempotency-Key": "test-key-" + i // MUST be unique
//       }
//     });
//     console.log(`✅ Request ${i} success`, res.status);
//   } catch (err) {
//     if (err.response) {
//       console.log(`❌ Request ${i} failed`, err.response.status);
//     } else {
//       console.log(`❌ Request ${i} error`, err.message);
//     }
//   }
// }

// Promise.all([
//   sendRequest(61),
//   sendRequest(62),
//   sendRequest(63),
//   sendRequest(64),
//   sendRequest(65)
// ]);
const CircuitBreaker = require("./circuitBreaker");
const { CircuitBreakerOpenError } = require("./errors");

// tiny helper
function assert(condition, message) {
  if (!condition) {
    throw new Error("❌ Assertion failed: " + message);
  }
  console.log("✅", message);
}

// helper sleep
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async function runTests() {

  console.log("\n--- TEST 1: Executes when CLOSED ---");
  {
    const breaker = new CircuitBreaker({ failureThreshold: 2 });

    const action = async () => "OK";

    const result = await breaker.execute(action);

    assert(result === "OK", "Action executed successfully");
    assert(breaker.state === "CLOSED", "Breaker remains CLOSED");
  }

 console.log("\n--- TEST 2: Opens after failure threshold ---");
{
  const breaker = new CircuitBreaker({ failureThreshold: 2 });

  const fail = async () => {
    throw new Error("fail");
  };

  try { await breaker.execute(fail); } catch {}
  try { await breaker.execute(fail); } catch {}

  // 🔥 this call proves breaker is OPEN
  try {
    await breaker.execute(fail);
  } catch {}

  assert(breaker.state === "OPEN", "Breaker moved to OPEN");
}


  console.log("\n--- TEST 3: Fails fast when OPEN ---");
  {
    const breaker = new CircuitBreaker({ failureThreshold: 1 });

    const fail = async () => {
      throw new Error("fail");
    };

    try { await breaker.execute(fail); } catch {}

    try {
      await breaker.execute(fail);
      assert(false, "Should not execute when OPEN");
    } catch (e) {
      assert(
        e instanceof CircuitBreakerOpenError,
        "Throws CircuitBreakerOpenError when OPEN"
      );
    }
  }

  console.log("\n--- TEST 4: HALF_OPEN → CLOSED on success ---");
  {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeout: 2000
    });

    const fail = async () => {
      throw new Error("fail");
    };

    try { await breaker.execute(fail); } catch {}
    assert(breaker.state === "OPEN", "Breaker is OPEN");

    await sleep(2100);

    const success = async () => "OK";
    const result = await breaker.execute(success);

    assert(result === "OK", "HALF_OPEN request succeeded");
    assert(breaker.state === "CLOSED", "Breaker reset to CLOSED");
  }

  console.log("\n--- TEST 5: HALF_OPEN → OPEN on failure ---");
  {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeout: 1000
    });

    const fail = async () => {
      throw new Error("fail");
    };

    try { await breaker.execute(fail); } catch {}
    assert(breaker.state === "OPEN", "Breaker is OPEN");

    await sleep(1100);

    try { await breaker.execute(fail); } catch {}
    assert(breaker.state === "OPEN", "Breaker re-opened after HALF_OPEN failure");
  }

  console.log("\n🎉 ALL CIRCUIT BREAKER TESTS PASSED\n");

})().catch(err => {
  console.error("\n🔥 TEST FAILED");
  console.error(err.message);
  process.exit(1);
});
