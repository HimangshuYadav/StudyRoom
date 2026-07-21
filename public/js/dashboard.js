/**
 * Queries the backend for a list of active public rooms and compiles cards in the dashboard container.
 *
 * @function loadPublicRooms
 * @returns {void}
 *
 * Implementation Steps:
 * 1. Fetch data from GET '/api/rooms' using standard headers (including JWT bearer authorization).
 * 2. Parse the JSON response representing the array of study rooms.
 * 3. Find the '#rooms-list' container in the document layout.
 * 4. Loop through each room object and map it to an HTML card format containing room name, topic, joinCode, and active members.
 * 5. Update innerHTML of the container to render cards, or show placeholder text if empty.
 */

let mockRooms = [
  {
    name: "DSA Revision",
    topic: "Trees",
    code: "ABC123",
    members: 12
  },
  {
    name: "DBMS Study",
    topic: "Normalization",
    code: "XYZ789",
    members: 8
  },
  {
    name: "Web Development",
    topic: "JavaScript",
    code: "WEB456",
    members: 15
  }
  ];

function generateRoomCode() {

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

        const randomIndex = Math.floor(Math.random() * characters.length);

        code += characters[randomIndex];
    }

    return code;
}

function renderRooms() {
  const roomsContainer = document.getElementById("rooms-list");

  roomsContainer.innerHTML = "";
  mockRooms.forEach((room) => {
    const roomCard = `
    <div class="room-card">
        <h3>${room.name}</h3>
        <p><strong>Topic:</strong> ${room.topic}</p>
        <p><strong>Members:</strong> ${room.members}</p>
        <div class="room-code-row">
    <p><strong>Code:</strong> ${room.code}</p>

    <button class="copy-btn" data-code="${room.code}">
        📋 Copy Code
    </button>
</div>
<button
    class="delete-btn"
    data-code="${room.code}">
    🗑 Delete Room
</button>
    </div>
`;

roomsContainer.innerHTML += roomCard;
  });
}

function loadPublicRooms() {
  
  
  renderRooms();
}

/**
 * Intercepts the submit action on the new room creation form, POSTs values to the backend room builder,
 * and routes the creator to the workspace view.
 *
 * @function handleCreateRoom
 * @param {Event} event - The HTML form submit event.
 * @returns {void}
 *
 * Implementation Steps:
 * 1. Call event.preventDefault() to prevent reloading.
 * 2. Fetch the room-name and room-topic values from inputs.
 * 3. Retrieve the JWT from localStorage and configure the header: { Authorization: "Bearer <token>" }.
 * 4. Submit fetch to POST '/api/rooms/create' attaching fields.
 * 5. Parse output and redirect page to room workspace, e.g., '/room/<roomId>'.
 */
function handleCreateRoom(event) {

    event.preventDefault();

    const roomName = document.getElementById("room-name").value.trim();
    const roomTopic = document.getElementById("room-topic").value.trim();

    if (roomName === "" || roomTopic === "") {
        alert("Please fill in both Room Name and Topic.");
        return;
    }

    const newRoom = {
        name: roomName,
        topic: roomTopic,
        code: generateRoomCode(),
        members: 1
    };

    mockRooms.push(newRoom);

    renderRooms();

    event.target.reset();
}

/**
 * Intercepts the join room form submit, sends the 6-character code to membership endpoint,
 * and enters the room collaborative workspace page on success.
 *
 * @function handleJoinRoom
 * @param {Event} event - The HTML form submit event.
 * @returns {void}
 *
 * Implementation Steps:
 * 1. Call event.preventDefault().
 * 2. Extract joinCode input from '#join-code'.
 * 3. Submit a POST request to '/api/rooms/join' specifying joinCode in body, carrying authorization tokens.
 * 4. If room exists and is joined, transition browser view to '/room/<roomId>'.
 * 5. On failure, alert error explanation.
 */
function handleJoinRoom(event) {
  event.preventDefault();
  // TODO: read joinCode from input, post to /api/rooms/join, redirect to room page
}

// Bind DOM handlers on page load
document.addEventListener('DOMContentLoaded', () => {
  loadPublicRooms();

  const createForm = document.getElementById('create-room-form');
  if (createForm) {
    createForm.addEventListener('submit', handleCreateRoom);
  }

  const joinForm = document.getElementById('join-room-form');
  if (joinForm) {
    joinForm.addEventListener('submit', handleJoinRoom);
  }
});

const searchInput = document.getElementById("room-search");

searchInput.addEventListener("input", function (event) {

    const searchText = event.target.value.toLowerCase();

    const roomCards = document.querySelectorAll(".room-card");
    let visibleCards = 0;

    roomCards.forEach((card) => {

    const roomText = card.textContent.toLowerCase();

    if (roomText.includes(searchText)) {
        card.style.display = "block";
        visibleCards++;
    } else {
        card.style.display = "none";
    }

});

const noResultsMessage = document.getElementById("no-results-message");

if (visibleCards === 0) {
    noResultsMessage.style.display = "block";
} else {
    noResultsMessage.style.display = "none";
}

});

document.addEventListener("click", function (event) {

    if (event.target.classList.contains("copy-btn")) {

        const roomCode = event.target.dataset.code;

        navigator.clipboard.writeText(roomCode);

        // Immediately change the button
        event.target.textContent = "✅ Copied!";
        event.target.classList.add("copied");

        // After 1.5 seconds, restore it
        setTimeout(() => {

            event.target.textContent = "📋 Copy Code";
            event.target.classList.remove("copied");

        }, 1500);

    }
    if (event.target.classList.contains("delete-btn")) {

    const roomCode = event.target.dataset.code;

    const confirmDelete = confirm("Are you sure you want to delete this room?");

if (confirmDelete) {
    mockRooms = mockRooms.filter(room => room.code !== roomCode);
    renderRooms();
}
}

});

const joinCodeInput = document.getElementById("join-code");
const codeCounter = document.getElementById("code-counter");

joinCodeInput.addEventListener("input", function () {

    joinCodeInput.value = joinCodeInput.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    const currentLength = joinCodeInput.value.length;

    codeCounter.textContent = `${currentLength}/6`;

    if (currentLength === 6) {
        codeCounter.classList.add("complete");
    } else {
        codeCounter.classList.remove("complete");
    }

});