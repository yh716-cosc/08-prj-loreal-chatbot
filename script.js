/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// System prompt for the chatbot (see previous instructions)
const systemPrompt =
  "You are a helpful assistant specializing in L’Oréal products, beauty routines, and recommendations. Only answer questions related to L’Oréal products, beauty routines, skincare, haircare, and beauty-related topics. If asked about anything unrelated to L’Oréal or beauty, politely respond that you can only assist with L’Oréal products, routines, and beauty advice.";

// Store the chat history for context
let messages = [{ role: "system", content: systemPrompt }];

// Function to add a message to the chat window
function addMessageToChat(role, text) {
  // Create a div for the message
  const messageDiv = document.createElement("div");
  messageDiv.className = role === "user" ? "user-message" : "bot-message";
  messageDiv.textContent = text;
  chatWindow.appendChild(messageDiv);
  // Scroll to the bottom so new messages are visible
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

/* Handle form submit */
chatForm.addEventListener("submit", async function (event) {
  event.preventDefault(); // Prevent page reload

  const userText = userInput.value.trim();
  if (!userText) return;

  // Show user's message
  addMessageToChat("user", userText);

  // Add user's message to history
  messages.push({ role: "user", content: userText });

  // Show loading message
  addMessageToChat("bot", "Thinking...");

  // Prepare API request
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`, // from [secrets.js](http://_vscodecontentref_/3)
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
      }),
    });

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
