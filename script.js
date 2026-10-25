let applications = [];
try {
    applications = JSON.parse(localStorage.getItem("applications")) || [];
} catch (error) {
    applications = []; // saved data was corrupted, so start fresh
}
if (!Array.isArray(applications)) applications = [];

let editingId = null; // null = adding, a number = editing

const formSection = document.querySelector(".form-section");
const form = document.getElementById("application-form");
const tableBody = document.getElementById("applications-body");
const table = document.querySelector(".applications-table");
const emptyMessage = document.getElementById("empty-message");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");

function saveAndRender() {
    localStorage.setItem("applications", JSON.stringify(applications));
    renderApplications();
}

function countStatus(status) {
    return applications.filter((a) => a.applicationStatus === status).length;
}

function renderApplications() {
    const search = searchInput.value.toLowerCase();
    const status = statusFilter.value;

    const shown = applications.filter((a) => {
        const text = (a.companyName + " " + a.jobTitle).toLowerCase();
        return text.includes(search) && (status === "all" || a.applicationStatus === status);
    });

    // textContent in the cells would be safer, but this keeps the code short.
    // The two text fields are escaped below so typed HTML can't break the page.
    tableBody.innerHTML = shown.map((a) => `
        <tr class="application-row">
            <td>${escapeHtml(a.companyName)}</td>
            <td>${escapeHtml(a.jobTitle)}</td>
            <td>${a.applicationDate}</td>
            <td>${a.deadline || "-"}</td>
            <td><span class="status-badge status-${a.applicationStatus.toLowerCase()}">${a.applicationStatus}</span></td>
            <td>
                <button type="button" class="edit-btn" data-id="${a.id}">Edit</button>
                <button type="button" class="delete-btn" data-id="${a.id}">Delete</button>
            </td>
        </tr>`).join("");

    table.classList.toggle("hidden", shown.length === 0);
    emptyMessage.classList.toggle("hidden", shown.length > 0);
    emptyMessage.textContent = applications.length === 0
        ? 'No applications yet. Click "Add Application" to add your first one.'
        : "No applications match your search.";

    // Dashboard numbers come from the saved data. Active = not Offer or Rejected.
    document.getElementById("total-count").textContent = applications.length;
    document.getElementById("active-count").textContent =
        applications.length - countStatus("Offer") - countStatus("Rejected");
    document.getElementById("interview-count").textContent = countStatus("Interview");
    document.getElementById("offer-count").textContent = countStatus("Offer");
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function showForm(application) {
    form.reset();
    editingId = application ? application.id : null;
    document.getElementById("form-title").textContent = application ? "Edit Application" : "Add Application";

    // Field names match the object keys, so this fills the whole form
    for (const key in application) {
        if (form.elements[key]) form.elements[key].value = application[key];
    }
    formSection.classList.remove("hidden");
    formSection.scrollIntoView({ behavior: "smooth" });
}

function hideForm() {
    formSection.classList.add("hidden");
    form.reset();
}

form.addEventListener("submit", function (event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form)); // all fields in one object

    if (data.companyName.trim() === "" || data.jobTitle.trim() === "") {
        alert("Please enter a company name and a job title.");
        return;
    }

    if (editingId) {
        const index = applications.findIndex((a) => a.id === editingId);
        applications[index] = { ...data, id: editingId };
    } else {
        applications.push({ ...data, id: Date.now() });
    }
    saveAndRender();
    hideForm();
});

// One listener handles every Edit and Delete button, even though rows get rebuilt
tableBody.addEventListener("click", function (event) {
    const id = Number(event.target.dataset.id);
    if (event.target.classList.contains("edit-btn")) {
        showForm(applications.find((a) => a.id === id));
    }
    if (event.target.classList.contains("delete-btn") && confirm("Delete this application?")) {
        applications = applications.filter((a) => a.id !== id);
        saveAndRender();
    }
});

document.querySelector(".add-application-btn").addEventListener("click", () => showForm());
document.querySelector(".cancel-btn").addEventListener("click", hideForm);
searchInput.addEventListener("input", renderApplications);
statusFilter.addEventListener("change", renderApplications);

renderApplications();