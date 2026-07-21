/**
 * Establishes a Socket.io connection for real-time chat.
 */
function initChatSocket(roomId, currentUser) {
  const socket = io();

  const messageContainer = document.getElementById("messages-container");
  const messageForm = document.getElementById("chat-form");
  const messageInput = document.getElementById("chat-input");
  const typingIndicator = document.getElementById("typing-indicator");

  // Join the collaborative room
  socket.emit("joinRoom", {
    roomId,
    userName: currentUser.name,
  });

  // Listen for incoming chat messages
  socket.on("newMessage", (message) => {
    if (!messageContainer) return;

    const messageElement = document.createElement("div");
    messageElement.className =
      message.userId === currentUser.id
        ? "chat-message own-message"
        : "chat-message";

    messageElement.innerHTML = `
      <div class="message-header">
        <strong>${message.userName}</strong>
        <span class="message-time">
          ${new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div class="message-body">
        ${message.text}
      </div>
    `;

    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  });

  // Display typing status
  socket.on("userTyping", ({ userName, typing }) => {
    if (!typingIndicator) return;

    if (typing) {
      typingIndicator.innerText = `${userName} is typing...`;
      typingIndicator.style.display = "block";
    } else {
      typingIndicator.innerText = "";
      typingIndicator.style.display = "none";
    }
  });

  // Send message
  if (messageForm && messageInput) {
    messageForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const text = messageInput.value.trim();

      if (!text) return;

      socket.emit("sendMessage", {
        roomId,
        userId: currentUser.id,
        userName: currentUser.name,
        text,
      });

      messageInput.value = "";

      socket.emit("typing", {
        roomId,
        userName: currentUser.name,
        typing: false,
      });
    });

    // Emit typing events
    let typingTimeout;

    messageInput.addEventListener("input", () => {
      socket.emit("typing", {
        roomId,
        userName: currentUser.name,
        typing: true,
      });

      clearTimeout(typingTimeout);

      typingTimeout = setTimeout(() => {
        socket.emit("typing", {
          roomId,
          userName: currentUser.name,
          typing: false,
        });
      }, 1000);
    });
  }

  // Optional: handle disconnects
  socket.on("disconnect", () => {
    console.log("Disconnected from chat server.");
  });

  socket.on("connect", () => {
    console.log("Connected to chat server.");
  });
}

// Auto-run if workspace metadata is active in page structure
document.addEventListener("DOMContentLoaded", () => {
  const workspace = document.querySelector(".room-workspace");

  if (workspace) {
    const roomId = workspace.getAttribute("data-room-id");

    // Replace this with your authenticated user information
    const currentUser = {
      id: "mock-user-id",
      name: "Mock Student",
    };

    initChatSocket(roomId, currentUser);
  }
});