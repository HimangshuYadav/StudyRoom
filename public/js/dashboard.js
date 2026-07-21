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
function loadPublicRooms() {
  // TODO: fetch public rooms list from GET /api/rooms, map/render cards to rooms-list container
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
  // TODO: read form inputs, post to /api/rooms/create, redirect to room page
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
