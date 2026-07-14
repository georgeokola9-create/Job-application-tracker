const API_BASE_URL = "http://localhost:8000";

const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const form = document.getElementById("application-form");
const formError = document.getElementById("form-error");
const applicationIdField = document.getElementById("application-id");

document.getElementById("open-add-modal-btn").addEventListener("click", () => openModal());
document.getElementById("close-modal-btn").addEventListener("click", closeModal);
document.getElementById("cancel-btn").addEventListener("click", closeModal);
form.addEventListener("submit", handleFormSubmit);

function openModal(application = null) {
    form.reset();
    formError.style.display = "none";

    if (application) {
        modalTitle.textContent = "Edit Application";
        applicationIdField.value = application.id;
        document.getElementById("company_name").value = application.company_name;
        document.getElementById("role_title").value = application.role_title;
        document.getElementById("status").value = application.status;
        document.getElementById("date_applied").value = application.date_applied;
        document.getElementById("application_deadline").value = application.application_deadline ?? "";
        document.getElementById("follow_up_date").value = application.follow_up_date ?? "";
        document.getElementById("contact_person").value = application.contact_person ?? "";
        document.getElementById("contact_email").value = application.contact_email ?? "";
        document.getElementById("reference_number").value = application.reference_number ?? "";
        document.getElementById("portal_url").value = application.portal_url ?? "";
        document.getElementById("notes").value = application.notes ?? "";
    } else {
        modalTitle.textContent = "Add Application";
        applicationIdField.value = "";
    }

    modalOverlay.style.display = "flex";
}

function closeModal() {
    modalOverlay.style.display = "none";
}

function buildPayloadFromForm() {
    const optionalField = (id) => {
        const value = document.getElementById(id).value.trim();
        return value === "" ? null : value;
    };

    return {
        company_name: document.getElementById("company_name").value.trim(),
        role_title: document.getElementById("role_title").value.trim(),
        status: document.getElementById("status").value,
        date_applied: document.getElementById("date_applied").value,
        application_deadline: optionalField("application_deadline"),
        follow_up_date: optionalField("follow_up_date"),
        contact_person: optionalField("contact_person"),
        contact_email: optionalField("contact_email"),
        reference_number: optionalField("reference_number"),
        portal_url: optionalField("portal_url"),
        notes: optionalField("notes"),
    };
}

async function handleFormSubmit(event) {
    event.preventDefault();
    formError.style.display = "none";

    const payload = buildPayloadFromForm();
    const id = applicationIdField.value;
    const isEditing = id !== "";

    const url = isEditing
        ? `${API_BASE_URL}/applications/${id}`
        : `${API_BASE_URL}/applications/`;
    const method = isEditing ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : "Something went wrong");
        }

        closeModal();
        fetchApplications();
    } catch (error) {
        formError.textContent = error.message;
        formError.style.display = "block";
    }
}

async function deleteApplication(id) {
    if (!confirm("Delete this application? This cannot be undone.")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/applications/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete application");
        fetchApplications();
    } catch (error) {
        alert(error.message);
    }
}

async function fetchApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications/`);
        if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
        const applications = await response.json();
        renderApplications(applications);
    } catch (error) {
        console.error("Failed to fetch applications:", error);
    }
}

function renderApplications(applications) {
    const tbody = document.getElementById("applications-body");
    const emptyMessage = document.getElementById("empty-message");

    tbody.innerHTML = "";

    if (applications.length === 0) {
        emptyMessage.style.display = "block";
        return;
    }
    emptyMessage.style.display = "none";

    applications.forEach((app) => {
        const row = document.createElement("tr");
        const portalCell = app.portal_url
            ? `<a href="${app.portal_url}" target="_blank" rel="noopener noreferrer" class="btn btn-portal">Track →</a>`
            : `<span class="empty-value">Not set</span>`;
        const deadlineCell = app.application_deadline
            ? app.application_deadline
            : `<span class="empty-value">No deadline</span>`;

        row.innerHTML = `
            <td>${app.company_name}</td>
            <td>${app.role_title}</td>
            <td><span class="status-badge status-${app.status}">${app.status.replace(/_/g, " ")}</span></td>
            <td>${app.date_applied}</td>
            <td>${deadlineCell}</td>
            <td>${portalCell}</td>
            <td>
                <button class="btn-icon edit-btn" data-id="${app.id}">Edit</button>
                <button class="btn-icon delete-btn" data-id="${app.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const app = applications.find((a) => a.id === Number(btn.dataset.id));
            openModal(app);
        });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => deleteApplication(Number(btn.dataset.id)));
    });
}

fetchApplications();
