import { AssignmentsRepository } from "./repository/assignmentsrepository.js";
import { app } from '/js/firebase.js';

const repo = new AssignmentsRepository(app);

const roleContainer = document.querySelector(".roles-scroll-container");
const addBtn = document.getElementById("add-role");
const submitBtn = document.getElementById("submit-assignment");

// Add role box
addBtn.addEventListener("click", function () {
  const newEntry = document.createElement("div");
  newEntry.classList.add("role-entry");
  newEntry.innerHTML = `
    <div class="inline-fields">
      <div>
        <label>Role name</label>
        <input type="text" class="input-dark role-name">
      </div>
      <div>
        <label>Capacity</label>
        <input type="number" class="input-dark capacity">
      </div>
      <div class="remove-wrapper">
        <button class="remove-role" title="Remove role">X</button>
      </div>
    </div>
  `;
  newEntry.querySelector(".remove-role").addEventListener("click", function () {
    newEntry.remove();
  });
  roleContainer.appendChild(newEntry);
});

// Submit assignment
submitBtn.addEventListener("click", async function () {
  const name = document.getElementById("assignment-name").value.trim();
  const description = document.getElementById("description").value.trim();
  const timeStart = document.getElementById("time-start").value;
  const timeEnd = document.getElementById("time-end").value;

  if (!name || !timeStart || !timeEnd) {
    alert("Fill in all fields");
    return;
  }

  const roleInputs = roleContainer.querySelectorAll(".role-entry");
  const roles = [];

  // Go through each role box and get the name and capacity values.
  // Save them in the roles list if they are valid.
  for (let i = 0; i < roleInputs.length; i++) {
    const entry = roleInputs[i];
    const roleName = entry.querySelector(".role-name").value.trim();
    const capacity = parseInt(entry.querySelector(".capacity").value);
    if (roleName && !isNaN(capacity)) {
      roles.push({ name: roleName, capacity });
    }
  }

  if (roles.length === 0) {
    alert("You must add at least one role");
    return;
  }

  try {
    await repo.createAssignmentWithRoles(
      { name, description, timeStart, timeEnd },
      roles
    );
    alert("Assignment successfully created!");
    window.location.href = "/?page=overview";
  } catch (err) {
    console.error("Failed to create assignment:", err);
    alert("Something went wrong.");
  }
});
