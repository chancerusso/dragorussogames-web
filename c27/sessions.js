const DATA_FILE = "./data/c27-sessions.json"

const sessionList = document.getElementById("sessionList")
const sessionTitle = document.getElementById("sessionTitle")
const sessionRecap = document.getElementById("sessionRecap")

let sessions = []

async function loadSessions() {
  try {
    const response = await fetch(DATA_FILE)

    if (!response.ok) {
      throw new Error("Failed to load sessions")
    }

    const data = await response.json()

    sessions = (data.sessions || []).sort((a, b) => b.number - a.number)

    renderList()

    if (sessions.length > 0) {
      showSession(0)
    }
  } catch (err) {
    console.error(err)

    sessionList.innerHTML = `
      <div class="empty-state">
        Could not load session archive.
      </div>
    `
  }
}

function renderList() {
  sessionList.innerHTML = ""

  if (sessions.length === 0) {
    sessionList.innerHTML = `
      <div class="empty-state">
        No sessions available.
      </div>
    `
    return
  }

  sessions.forEach((session, index) => {
    const btn = document.createElement("button")
    btn.className = "session-tab"

    btn.innerHTML = `
      <div class="session-number">Session ${session.number}</div>
      <span>${session.title}</span>
    `

    btn.addEventListener("click", () => showSession(index))

    sessionList.appendChild(btn)
  })
}

function showSession(index) {
  const session = sessions[index]

  document.querySelectorAll(".session-tab").forEach((tab, i) => {
    tab.classList.toggle("active", i === index)
  })

  sessionTitle.textContent = `Session ${session.number} • ${session.title}`

  sessionRecap.innerHTML = session.recap
    .map(paragraph => `<p>${paragraph}</p>`)
    .join("")
}

loadSessions()