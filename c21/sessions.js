const STORAGE_KEY = "c21Sessions"

const sessionList = document.getElementById("sessionList")
const sessionTitle = document.getElementById("sessionTitle")
const sessionRecap = document.getElementById("sessionRecap")

const newSessionBtn = document.getElementById("newSessionBtn")
const saveSessionBtn = document.getElementById("saveSessionBtn")
const deleteSessionBtn = document.getElementById("deleteSessionBtn")

let sessions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
let currentIndex = null

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

function renderList() {
  sessionList.innerHTML = ""

  if (sessions.length === 0) {
    sessionList.innerHTML = `<p class="empty-state">No sessions saved yet.</p>`
    return
  }

  sessions.forEach((session, index) => {
    const btn = document.createElement("button")
    btn.className = "session-tab"
    if (index === currentIndex) btn.classList.add("active")
    btn.textContent = session.title || `Session ${sessions.length - index}`

    btn.addEventListener("click", () => loadSession(index))

    sessionList.appendChild(btn)
  })
}

function loadSession(index) {
  currentIndex = index
  sessionTitle.value = sessions[index].title || ""
  sessionRecap.value = sessions[index].recap || ""
  renderList()
}

function clearEditor() {
  currentIndex = null
  sessionTitle.value = ""
  sessionRecap.value = ""
  renderList()
}

function saveSession() {
  const title = sessionTitle.value.trim()
  const recap = sessionRecap.value.trim()

  if (!title) {
    alert("Please enter a session title.")
    return
  }

  const sessionData = {
    title,
    recap,
    updatedAt: new Date().toISOString()
  }

  if (currentIndex === null) {
    sessions.unshift(sessionData)
    currentIndex = 0
  } else {
    sessions[currentIndex] = sessionData
  }

  saveToStorage()
  renderList()
}

function deleteSession() {
  if (currentIndex === null) return

  const confirmDelete = confirm("Delete this session recap?")
  if (!confirmDelete) return

  sessions.splice(currentIndex, 1)
  saveToStorage()
  clearEditor()
}

newSessionBtn.addEventListener("click", clearEditor)
saveSessionBtn.addEventListener("click", saveSession)
deleteSessionBtn.addEventListener("click", deleteSession)

renderList()

if (sessions.length > 0) {
  loadSession(0)
}