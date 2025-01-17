import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 5,
  timeout: 30000,
});

let threadLocks = {};

export const sendMessage = async (message, assistantId, threadId) => {
  try {
    if (!threadId) {
      threadId = await createThreadId();
    }

    const response = await messageAssistant(message, threadId, assistantId);

    return {
      threadId,
      response,
    };
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

async function runWait(threadId, runId) {
  // Function to retrieve the status
  const retrieveStatus = async () => {
    const retrieve = await openai.beta.threads.runs.retrieve(threadId, runId);
    return retrieve.status;
  };

  // Max time to wait before giving up (20 seconds)
  const maxTime = 60000; // 20 seconds in milliseconds

  return new Promise((resolve, reject) => {
    const startTime = Date.now(); // Record start time
    const checkInterval = 1500; // Check every 500 milliseconds (0.5 second)

    const timeoutCheck = setTimeout(() => {
      reject(
        new Error(
          "Timeout: Status check exceeded 20 seconds without completion."
        )
      );
    }, maxTime);

    const checkStatus = async () => {
      try {
        const status = await retrieveStatus();
        console.log("Status: ", status);

        if (status === "completed") {
          clearTimeout(timeoutCheck); // Clear the timeout if completed
          resolve("completed");
        } else {
          // If not completed, check if we have exceeded the max wait time
          if (Date.now() - startTime >= maxTime) {
            clearTimeout(timeoutCheck); // Clear the timeout as a precaution
            reject(
              new Error(
                "Timeout: Status check exceeded 20 seconds without completion."
              )
            );
          } else {
            // If not completed and not timed out, check again after a delay
            setTimeout(checkStatus, checkInterval);
          }
        }
      } catch (error) {
        clearTimeout(timeoutCheck); // Clear the timeout on error
        reject(error);
      }
    };

    // Start checking
    checkStatus();
  });
}

export const messageAssistant = async (message, threadId, assistantId) => {
  if (!threadLocks[threadId]) {
    threadLocks[threadId] = Promise.resolve();
  }

  await threadLocks[threadId];

  let resolveLock;
  threadLocks[threadId] = new Promise((resolve) => {
    resolveLock = resolve;
  });

  try {
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message || "Hi!",
    });

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    await runWait(threadId, run.id);

    const res = await openai.beta.threads.messages.list(threadId, {
      limit: 1,
      order: "desc",
    });

    const replyMessage = res.data[0].content[0].text.value;

    return replyMessage;
  } catch (error) {
    console.log("Error sending message to assistant: ", error);
    throw error;
  } finally {
    resolveLock();
  }
};

export const createThreadId = async () => {
  try {
    const thread = await openai.beta.threads.create();

    return thread.id;
  } catch (error) {
    console.log("Error creating assistant thread: ", error);
    throw error;
  }
};
