//@ts-nocheck
const apiUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
function randString() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
export function getWidgetScript(workspaceId: string) {
  const widgetScript = `
  (async function () {
  await new Promise((r) => setTimeout(r, 1000));
  const POLLING_INTERVAL = 3000; 
  let lastMessageTimestamp = Date.now();
  let userInfo = null;
  let pollInterval = null;
  let chatId = "${randString()}"

  // Create registration form
  function createRegistrationForm() {
    const form = document.createElement("div");
    form.id = "chat-registration";
    Object.assign(form.style, {
      position: "fixed",
      bottom: "90px",
      right: "20px",
      width: "350px",
      background: "white",
      borderRadius: "10px",
      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      zIndex: "999",
      display: "none",
    });

    const title = document.createElement("h3");
    title.textContent = "Enter your details to chat";
    Object.assign(title.style, {
      margin: "0 0 20px 0",
      fontSize: "16px",
      color: "#333",
    });

    const nameInput = document.createElement("input");
    nameInput.id = "chat-name";
    nameInput.type = "text";
    nameInput.placeholder = "Your name";
    Object.assign(nameInput.style, {
      width: "100%",
      padding: "10px",
      marginBottom: "10px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
      boxSizing: "border-box",
    });

    const emailInput = document.createElement("input");
    emailInput.id = "chat-email";
    emailInput.type = "email";
    emailInput.placeholder = "Your email";
    Object.assign(emailInput.style, {
      width: "100%",
      padding: "10px",
      marginBottom: "15px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
      boxSizing: "border-box",
    });

    const startButton = document.createElement("button");
    startButton.id = "chat-start";
    startButton.textContent = "Start Chat";
    Object.assign(startButton.style, {
      width: "100%",
      padding: "10px",
      background: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
    });

    form.appendChild(title);
    form.appendChild(nameInput);
    form.appendChild(emailInput);
    form.appendChild(startButton);

    return form;
  }

  // Create chat button
  function createChatButton() {
    const btn = document.createElement("button");
    btn.id = "chat-toggle-btn";
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "60px",
      height: "60px",
      borderRadius: "30px",
      background: "#007bff",
      color: "white",
      border: "none",
      cursor: "pointer",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "transform 0.3s ease",
      zIndex: "1000",
    });

    btn.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    return btn;
  }

  // Create chat window
  function createChatWindow() {
    const container = document.createElement("div");
    container.id = "chat-container";
    Object.assign(container.style, {
      position: "fixed",
      bottom: "90px",
      right: "20px",
      width: "350px",
      height: "500px",
      background: "white",
      borderRadius: "10px",
      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      display: "none",
      flexDirection: "column",
      fontFamily: "system-ui, -apple-system, sans-serif",
      zIndex: "999",
      overflow: "hidden",
    });

    const header = document.createElement("div");
    Object.assign(header.style, {
      padding: "15px",
      background: "#f8f9fa",
      borderBottom: "1px solid #eee",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    });

    const title = document.createElement("h3");
    title.textContent = "Chat Support";
    Object.assign(title.style, {
      margin: "0",
      fontSize: "16px",
      color: "#333",
    });

    const closeBtn = document.createElement("button");
    closeBtn.id = "chat-close";
    closeBtn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    Object.assign(closeBtn.style, {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "5px",
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    container.appendChild(header);

    const messages = document.createElement("div");
    messages.id = "chat-messages";
    Object.assign(messages.style, {
      flex: "1",
      overflowY: "auto",
      padding: "15px",
      background: "#f8f9fa",
    });
    container.appendChild(messages);

    const inputArea = document.createElement("div");
    Object.assign(inputArea.style, {
      padding: "15px",
      background: "white",
      borderTop: "1px solid #eee",
    });

    const inputWrapper = document.createElement("div");
    Object.assign(inputWrapper.style, {
      display: "flex",
      gap: "8px",
    });

    const input = document.createElement("input");
    input.id = "chat-input";
    input.placeholder = "Type your message...";
    Object.assign(input.style, {
      flex: "1",
      padding: "10px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
    });

    const sendBtn = document.createElement("button");
    sendBtn.id = "chat-send";
    sendBtn.textContent = "Send";
    Object.assign(sendBtn.style, {
      padding: "10px 20px",
      background: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
    });

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(sendBtn);
    inputArea.appendChild(inputWrapper);
    container.appendChild(inputArea);

    return container;
  }

  function clearMessages() {
    const messages = document.getElementById("chat-messages");
    while (messages.firstChild) {
      messages.removeChild(messages.firstChild);
    }
  }

  // Add message to chat
  function addMessage(text, isUser = false, skipScroll = false) {
    const messages = document.getElementById("chat-messages");
    const messageDiv = document.createElement("div");
    messageDiv.style.marginBottom = "10px";
    messageDiv.style.textAlign = isUser ? "right" : "left";

    const bubble = document.createElement("div");
    Object.assign(bubble.style, {
      display: "inline-block",
      padding: "12px 16px",
      borderRadius: "18px",
      maxWidth: "80%",
      wordBreak: "break-word",
      fontSize: "14px",
      lineHeight: "1.4",
      backgroundColor: isUser ? "#007bff" : "white",
      color: isUser ? "white" : "#333",
      boxShadow: isUser ? "none" : "0 1px 2px rgba(0,0,0,0.1)",
    });

    bubble.textContent = text;
    messageDiv.appendChild(bubble);
    messages.appendChild(messageDiv);

    if (!skipScroll) {
      messages.scrollTop = messages.scrollHeight;
    }
  }

  // Create and append all elements
  const wrapper = document.createElement("div");
  wrapper.appendChild(createChatButton());
  wrapper.appendChild(createRegistrationForm());
  wrapper.appendChild(createChatWindow());
  document.body.appendChild(wrapper);

  // Get references to DOM elements
  const toggleBtn = document.getElementById("chat-toggle-btn");
  const closeBtn = document.getElementById("chat-close");
  const container = document.getElementById("chat-container");
  const registration = document.getElementById("chat-registration");
  const messages = document.getElementById("chat-messages");
  const input = document.getElementById("chat-input");
  const sendButton = document.getElementById("chat-send");
  const startButton = document.getElementById("chat-start");
  const nameInput = document.getElementById("chat-name");
  const emailInput = document.getElementById("chat-email");

  // Check for existing user info
  try {
    userInfo = JSON.parse(localStorage.getItem("chatUserInfo"));
  } catch (e) {
    userInfo = null;
  }

  // Toggle chat window or registration
  let isOpen = false;

  function openChat() {
    isOpen = true;
    if (userInfo) {
      container.style.display = "flex";
      registration.style.display = "none";
    } else {
      container.style.display = "none";
      registration.style.display = "block";
    }
    toggleBtn.style.transform = "scale(0.8)";
    if (userInfo) {
      input.focus();
      pollInterval = setInterval(pollMessages, POLLING_INTERVAL);
    }
  }

  function closeChat() {
    isOpen = false;
    container.style.display = "none";
    registration.style.display = "none";
    toggleBtn.style.transform = "scale(1)";
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  // Event listener for registration
  startButton.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
      alert("Please enter both name and email");
      return;
    }

    userInfo = { name, email };
    localStorage.setItem("chatUserInfo", JSON.stringify(userInfo));

    registration.style.display = "none";
    container.style.display = "flex";
    input.focus();
    pollInterval = setInterval(pollMessages, POLLING_INTERVAL);
  });

  // Event listeners for toggle buttons
  toggleBtn.addEventListener("click", () => {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  });

  closeBtn.addEventListener("click", () => {
    closeChat();
  });

  // Send message to backend
  async function sendMessage(text) {
    if (!text.trim() || !userInfo) return;

    addMessage(text, true);
    input.value = "";
    lastMessageTimestamp = Date.now();

    try {
      const response = await fetch("${apiUrl}/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: "${workspaceId}",
          message: text,
          user: userInfo,
          chatId: chatId
        }),
      });

      const data = await response.json();
      await pollMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage("Sorry, there was an error sending your message.");
    }
  }

  // Poll for new messages
  async function pollMessages() {
    if (!userInfo) return;

    try {
      const response = await fetch(
         \`${apiUrl}/api/chat?workspaceId=${workspaceId}&chatId=\${chatId}\`,
        {
          method: "GET",
        }
      );

      const data = await response.json();
      if (data && data.length > 0) {
        clearMessages();
        data.forEach((msg) => {
          addMessage(msg.content, msg?.role === 'customer', true);
        });
        lastMessageTimestamp = Date.now();
        messages.scrollTop = messages.scrollHeight;
      }
    } catch (error) {
      console.error("Error polling messages:", error);
    }
  }

  // Add event listeners for sending messages
  sendButton.addEventListener("click", () => {
    sendMessage(input.value);
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage(input.value);
    }
  });
  //   })
})();
`

  return widgetScript
}
