/**
 * Sets up synchronization for the collaborative room notes.
 */
function initNotesSync(roomId) {
  const textarea = document.getElementById("shared-notes-editor");
  const statusBadge = document.getElementById("notes-save-status");

  if (!textarea) return;

  const token = localStorage.getItem("token");

  let debounceTimer;

  /**
   * Updates the save status badge.
   */
  function setStatus(status) {
    if (!statusBadge) return;
    statusBadge.textContent = status;
  }

  /**
   * Loads existing notes.
   */
  async function loadNotes() {
    setStatus("Loading...");

    try {
      const response = await fetch(`/api/notes/${roomId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load notes.");
      }

      const data = await response.json();

      textarea.value = data.content || "";

      setStatus("Saved");
    } catch (error) {
      console.error(error);
      setStatus("Load Failed");
    }
  }

  /**
   * Saves notes to the server.
   */
  async function saveNotes() {
    setStatus("Saving...");

    try {
      const response = await fetch(`/api/notes/${roomId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: textarea.value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes.");
      }

      setStatus("Saved");
    } catch (error) {
      console.error(error);
      setStatus("Save Failed");
    }
  }

  // Load notes initially
  loadNotes();

  // Auto-save with 1.5-second debounce
  textarea.addEventListener("input", () => {
    setStatus("Saving...");

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      saveNotes();
    }, 1500);
  });
}

// Auto-run if workspace metadata is active in page structure
document.addEventListener("DOMContentLoaded", () => {
  const workspace = document.querySelector(".room-workspace");

  if (workspace) {
    const roomId = workspace.getAttribute("data-room-id");
    initNotesSync(roomId);
  }
});