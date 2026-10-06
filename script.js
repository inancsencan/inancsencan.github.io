const slides = document.getElementById("slides");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const roomCounter = document.getElementById("roomCounter");
const personaName = document.getElementById("personaName");

const dots = document.querySelectorAll(".dot");

let currentRoom = 0;

const rooms = [
  {
    name: "Architecture",
    accent: "#d9a85c",
    header: "rgba(31, 29, 25, 0.78)",
  },
  {
    name: "Computational Design",
    accent: "#86a9ff",
    header: "rgba(13, 19, 33, 0.80)",
  },
  {
    name: "Interactive Arts",
    accent: "#d99ad0",
    header: "rgba(36, 20, 39, 0.80)",
  },
];

function updateRoom() {
  slides.style.transform = `translateX(-${currentRoom * 100}vw)`;

  const room = rooms[currentRoom];

  personaName.textContent = room.name;

  roomCounter.textContent = `${String(currentRoom + 1).padStart(2, "0")} / ${String(rooms.length).padStart(2, "0")}`;

  document.documentElement.style.setProperty("--accent", room.accent);

  document.documentElement.style.setProperty("--header-bg", room.header);

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentRoom);
  });
}

function goNext() {
  currentRoom = (currentRoom + 1) % rooms.length;

  updateRoom();
}

function goPrevious() {
  currentRoom = (currentRoom - 1 + rooms.length) % rooms.length;

  updateRoom();
}

nextBtn.addEventListener("click", goNext);

prevBtn.addEventListener("click", goPrevious);

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    currentRoom = Number(dot.dataset.room);

    updateRoom();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    goNext();
  }

  if (event.key === "ArrowLeft") {
    goPrevious();
  }
});

updateRoom();
