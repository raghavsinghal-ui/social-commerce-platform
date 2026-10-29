const URL =
  " http://localhost:3000/api/products/continueConversation/68b1a7f2c9e4a12345678901/black/68b1a7d5c9e4a12345678902";

async function sendRequest(i) {
    try {
         const response = await fetch(URL, {
            method: "GET"
        });

        const data = await response.json();

        return {
            request: i,
            success: response.ok,
            data
        };
    } catch (error) {
        console.log("REQUEST", i);
    console.log(error);
    console.log("CAUSE:", error.cause);
        return {
            request: i,
            success: false,
            error: error.message
        };
    }
}

async function main() {
    const TOTAL_REQUESTS = 100;

    const start = Date.now();

    const promises = Array.from(
        { length: TOTAL_REQUESTS },
        (_, i) => sendRequest(i + 1)
    );

    const results = await Promise.all(promises);

    const duration = Date.now() - start;

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log("Total:", results.length);
    console.log("Successful:", successful.length);
    console.log("Failed:", failed.length);
    console.log("Time:", duration, "ms");

    console.log("\nSuccessful requests:");
    console.log(successful);
//     console.log("\nFailed requests:");
//     console.log(failed);
// }
}

main();