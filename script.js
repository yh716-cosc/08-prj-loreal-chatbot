/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// System prompt for the chatbot
const systemPrompt =
  "You are a helpful assistant specializing in L’Oréal products, beauty routines, and recommendations. Only answer questions related to L’Oréal products, beauty routines, skincare, haircare, and beauty-related topics. If asked about anything unrelated to L’Oréal or beauty, politely respond that you can only assist with L’Oréal products, routines, and beauty advice. If you know the user's name, use it in your responses for a friendly experience.";

// Store the chat history for context
let messages = [{ role: "system", content: systemPrompt }];

// Track if we know the user's name
let userName = null;

// Function to add a message to the chat window
function addMessageToChat(role, text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = role === "user" ? "user-message" : "bot-message";
  // For bot messages, format and convert newlines to <br>
  if (role === "bot") {
    const formatted = formatBotReply(text);
    messageDiv.innerHTML = formatted.replace(/\n/g, "<br>");
  } else {
    messageDiv.textContent = text;
  }
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Helper function to format bot responses for better readability
function formatBotReply(text) {
  // Add a new line before each bullet or number in a list
  // Handles: - item, • item, 1. item, 2. item, etc.
  let formatted = text
    .replace(/(\n)?([•\-]\s)/g, "\n$2") // Bullets
    .replace(/(\n)?(\d+\.\s)/g, "\n$2"); // Numbers

  // Convert markdown **bold** to <b>bold</b>
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  return formatted;
}

// Set initial message
chatWindow.textContent = "👋 Hello! What's your name?";

/* Helper function to extract username from user input */
function extractUserName(text) {
  // Check for patterns like "My name is Alice", "I'm Bob", "I am Carol"
  const nameMatch = text.match(
    /(?:my name is|i[' ]?m|i am)\s+([A-Za-zÀ-ÖØ-öø-ÿ'-]+)/i
  );
  if (nameMatch) {
    return nameMatch[1];
  }
  return null;
}

// Function to show the latest question above the bot's response
function showLatestQuestion(question) {
  // Remove any previous latest-question div
  const oldDiv = document.getElementById("latest-question");
  if (oldDiv) {
    oldDiv.remove();
  }
  // Create a new div for the latest question
  const latestDiv = document.createElement("div");
  latestDiv.id = "latest-question";
  latestDiv.className = "latest-question";
  latestDiv.textContent = `You asked: ${question}`;
  chatWindow.appendChild(latestDiv);
}

/* Handle form submit */
chatForm.addEventListener("submit", async function (event) {
  event.preventDefault(); // Prevent page reload

  const userText = userInput.value.trim();
  if (!userText) return;

  addMessageToChat("user", userText);

  // Try to extract username from input
  if (!userName) {
    const possibleName = extractUserName(userText);
    if (possibleName) {
      userName = possibleName;
    } else {
      userName = userText; // fallback: treat whole input as name
    }
    addMessageToChat(
      "bot",
      `Nice to meet you, ${userName}! How can I help you with L’Oréal products or routines today?`
    );
    messages.push({ role: "user", content: `My name is ${userName}.` });
    messages.push({
      role: "assistant",
      content: `Nice to meet you, ${userName}! How can I help you with L’Oréal products or routines today?`,
    });
    userInput.value = "";
    return;
  }

  // Add user's message to history
  messages.push({ role: "user", content: userText });

  // Show the latest question above the bot's response
  showLatestQuestion(userText);

  // Show loading message
  addMessageToChat("bot", "Thinking...");

  // Prepare API request
  try {
    // Use Cloudflare Worker URL instead of OpenAI API
    const response = await fetch(
      "https://loreal-chatbot-worker.huangyx1113.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // No Authorization header needed for Cloudflare Worker
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: messages,
        }),
      }
    );

    const data = await response.json();

    // Remove loading message
    chatWindow.lastChild.remove();

    // Get chatbot reply
    const botReply = data.choices[0].message.content;

    // Show chatbot's message
    addMessageToChat("bot", botReply);

    // Add bot reply to history
    messages.push({ role: "assistant", content: botReply });
  } catch (error) {
    // Remove loading message
    chatWindow.lastChild.remove();
    addMessageToChat(
      "bot",
      "Sorry, there was a problem connecting to the chatbot."
    );
    console.error(error);
  }

  // Clear input box
  userInput.value = "";
});
