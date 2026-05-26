const STORAGE_KEY = "c26Sessions"

const sessionList = document.getElementById("sessionList")
const sessionTitle = document.getElementById("sessionTitle")
const sessionRecap = document.getElementById("sessionRecap")

const newSessionBtn = document.getElementById("newSessionBtn")
const saveSessionBtn = document.getElementById("saveSessionBtn")
const deleteSessionBtn = document.getElementById("deleteSessionBtn")

const sessionModal = document.getElementById("sessionModal")
const modalTitle = document.getElementById("modalTitle")
const modalRecap = document.getElementById("modalRecap")
const closeModalBtn = document.getElementById("closeModalBtn")
const returnModalBtn = document.getElementById("returnModalBtn")
const editSessionBtn = document.getElementById("editSessionBtn")
const deleteModalBtn = document.getElementById("deleteModalBtn")

let sessions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
let currentIndex = null
let modalSessionIndex = null

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

function renderList() {
  sessionList.innerHTML = ""

  if (sessions.length === 0) {
    sessionList.innerHTML = `
      <div class="empty-state">
        No sessions saved yet.
      </div>
    `
    return
  }

  sessions.forEach((session, index) => {
    const btn = document.createElement("button")
    btn.className = "session-tab"
    btn.innerHTML = `<span>${session.title}</span>`

    btn.addEventListener("click", () => {
      openModal(session, index)
    })

    sessionList.appendChild(btn)
  })
}

function openModal(session, index) {
  modalSessionIndex = index
  modalTitle.textContent = session.title
  modalRecap.innerHTML = `<p>${session.recap.replace(/\n/g, "</p><p>")}</p>`
  sessionModal.classList.add("active")
}

function closeModal() {
  sessionModal.classList.remove("active")
  modalSessionIndex = null
}

function clearEditor() {
  currentIndex = null
  sessionTitle.value = ""
  sessionRecap.value = ""
  sessionTitle.focus()
}

function saveSession() {
  const title = sessionTitle.value.trim()
  const recap = sessionRecap.value.trim()

  if (!title || !recap) {
    alert("Please complete the session title and recap.")
    return
  }

  const sessionData = {
    title,
    recap,
    updatedAt: new Date().toISOString()
  }

  if (currentIndex === null) {
    sessions.unshift(sessionData)
  } else {
    sessions[currentIndex] = sessionData
  }

  saveToStorage()
  renderList()
  clearEditor()
}

function deleteSession() {
  if (currentIndex === null) return

  const confirmDelete = confirm("Delete this session recap?")
  if (!confirmDelete) return

  sessions.splice(currentIndex, 1)

  saveToStorage()
  renderList()
  clearEditor()
}

function editModalSession() {
  if (modalSessionIndex === null) return

  currentIndex = modalSessionIndex
  sessionTitle.value = sessions[currentIndex].title
  sessionRecap.value = sessions[currentIndex].recap

  closeModal()

  document.querySelector(".session-viewer").scrollIntoView({
    behavior: "smooth",
    block: "start"
  })
}

function deleteModalSession() {
  if (modalSessionIndex === null) return

  const confirmDelete = confirm("Delete this session recap?")
  if (!confirmDelete) return

  sessions.splice(modalSessionIndex, 1)

  saveToStorage()
  renderList()
  closeModal()
  clearEditor()
}

newSessionBtn.addEventListener("click", clearEditor)
saveSessionBtn.addEventListener("click", saveSession)
deleteSessionBtn.addEventListener("click", deleteSession)

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal)
}

returnModalBtn.addEventListener("click", closeModal)
editSessionBtn.addEventListener("click", editModalSession)
deleteModalBtn.addEventListener("click", deleteModalSession)

sessionModal.addEventListener("click", (e) => {
  if (e.target === sessionModal) closeModal()
})

renderList()