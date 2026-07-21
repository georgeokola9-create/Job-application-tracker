const API_BASE_URL = "http://localhost:8000";

const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const form = document.getElementById("application-form");
const formError = document.getElementById("form-error");
const applicationIdField = document.getElementById("application-id");
const deleteModalOverlay = document.getElementById("delete-modal-overlay");
const deleteTargetName = document.getElementById("delete-target-name");
const ARCHIVE_STATUSES = ["rejected", "withdrawn"];
const ACTIVE_STATUSES_FOR_ALERTS = ["applied", "under_review", "interview_scheduled", "interviewed"];
const NOTIFICATION_PREVIEW_LIMIT = 8;
let allApplications = [];
let currentView = "active";
let pendingDeleteId = null;

document.getElementById("open-add-modal-btn").addEventListener("click", () => openModal());
document.getElementById("notification-bell-btn").addEventListener("click", (event) => {
    event.stopPropagation();
    const dropdown = document.getElementById("notification-dropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
});
document.addEventListener("click", (event) => {
    if (event.target.id === "view-all-notifications-btn") openNotificationsPage();
});
document.getElementById("close-modal-btn").addEventListener("click", closeModal);
document.getElementById("cancel-btn").addEventListener("click", closeModal);
document.getElementById("close-delete-modal-btn").addEventListener("click", closeDeleteModal);
document.getElementById("cancel-delete-btn").addEventListener("click", closeDeleteModal);
document.getElementById("confirm-delete-btn").addEventListener("click", confirmDelete);
document.getElementById("close-notifications-page-btn").addEventListener("click", () => {
    document.getElementById("notifications-page-overlay").style.display = "none";
});
document.getElementById("notification-type-filter").addEventListener("change", renderNotificationsPage);
document.getElementById("notification-sort").addEventListener("change", renderNotificationsPage);
document.getElementById("active-view-btn").addEventListener("click", () => switchView("active"));
document.getElementById("archive-view-btn").addEventListener("click", () => switchView("archive"));
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search-btn");

searchInput.addEventListener("input", () => {
    clearSearchBtn.style.display = searchInput.value ? "block" : "none";
    applyFilters();
});

clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    applyFilters();
    searchInput.focus();
});

document.getElementById("status-filter").addEventListener("change", applyFilters);
form.addEventListener("submit", handleFormSubmit);

function switchView(view) {
    currentView = view;
    document.getElementById("active-view-btn").classList.toggle("toggle-active", view === "active");
    document.getElementById("archive-view-btn").classList.toggle("toggle-active", view === "archive");
    applyFilters();
}

function updateSummary() {
    const total = allApplications.length;
    const applied = allApplications.filter((a) => a.status === "applied").length;
    const interviews = allApplications.filter((a) =>
        a.status === "interview_scheduled" || a.status === "interviewed"
    ).length;
    const offers = allApplications.filter((a) => a.status === "offer").length;
    const rejected = allApplications.filter((a) => a.status === "rejected").length;

    document.getElementById("summary-total").textContent = total;
    document.getElementById("summary-applied").textContent = applied;
    document.getElementById("summary-interviews").textContent = interviews;
    document.getElementById("summary-offers").textContent = offers;
    document.getElementById("summary-rejected").textContent = rejected;
}

function parseDateOnly(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function getDaysUntil(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = parseDateOnly(dateString);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function computeNotifications() {
    const notifications = [];

    allApplications
        .filter((app) => ACTIVE_STATUSES_FOR_ALERTS.includes(app.status))
        .forEach((app) => {
            if (app.application_deadline) {
                const daysUntil = getDaysUntil(app.application_deadline);
                if (daysUntil < 0) {
                    notifications.push({
                        application: app,
                        title: `Deadline passed - ${app.company_name}`,
                        detail: `Was due ${app.application_deadline}`,
                        urgency: daysUntil,
                    });
                } else if (daysUntil <= 3) {
                    notifications.push({
                        application: app,
                        title: `Deadline approaching - ${app.company_name}`,
                        detail: daysUntil === 0
                            ? "Due today"
                            : `Due in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`,
                        urgency: daysUntil,
                    });
                }
            }

            if (app.follow_up_date) {
                const daysUntil = getDaysUntil(app.follow_up_date);
                if (daysUntil <= 0) {
                    notifications.push({
                        application: app,
                        title: `Follow-up due - ${app.company_name}`,
                        detail: daysUntil === 0
                            ? "Due today"
                            : `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) > 1 ? "s" : ""}`,
                        urgency: daysUntil,
                    });
                }
            }
        });

    return notifications.sort((a, b) => a.urgency - b.urgency);
}

function renderNotifications() {
    const notifications = computeNotifications();
    const badge = document.getElementById("notification-badge");
    const dropdown = document.getElementById("notification-dropdown");

    dropdown.innerHTML = "";

    if (notifications.length === 0) {
        badge.style.display = "none";
        const emptyState = document.createElement("div");
        emptyState.className = "notification-empty";
        emptyState.textContent = "No alerts right now. You're all caught up.";
        dropdown.appendChild(emptyState);
        return;
    }

    badge.textContent = notifications.length;
    badge.style.display = "flex";

    const visibleNotifications = notifications.slice(0, NOTIFICATION_PREVIEW_LIMIT);
    const remainingCount = notifications.length - visibleNotifications.length;

    visibleNotifications.forEach((notification) => {
        const item = document.createElement("button");
        const title = document.createElement("div");
        const detail = document.createElement("div");

        item.className = "notification-item";
        title.className = "notification-item-title";
        detail.className = "notification-item-detail";
        title.textContent = notification.title;
        detail.textContent = notification.detail;

        item.append(title, detail);
        item.addEventListener("click", () => {
            dropdown.style.display = "none";
            openViewModal(notification.application);
        });
        dropdown.appendChild(item);
    });

    if (remainingCount > 0) {
        const more = document.createElement("div");
        more.className = "notification-more";
        more.textContent = `+ ${remainingCount} more alert${remainingCount > 1 ? "s" : ""}`;
        dropdown.appendChild(more);
    }

    const viewAll = document.createElement("button");
    viewAll.id = "view-all-notifications-btn";
    viewAll.className = "view-all-btn";
    viewAll.type = "button";
    viewAll.textContent = "View all →";
    dropdown.appendChild(viewAll);
}

function openNotificationsPage() {
    document.getElementById("notification-dropdown").style.display = "none";
    document.getElementById("notifications-page-overlay").style.display = "flex";
    renderNotificationsPage();
}

function getNotificationType(notification) {
    return notification.title.startsWith("Follow-up") ? "followup" : "deadline";
}

function renderNotificationsPage() {
    const typeFilter = document.getElementById("notification-type-filter").value;

    let notifications = computeNotifications().map((n) => ({
        ...n,
        type: n.title.startsWith("Follow-up") ? "followup" : "deadline",
    }));

    if (typeFilter) notifications = notifications.filter((n) => n.type === typeFilter);

    const sortOrder = document.getElementById("notification-sort").value;

    if (sortOrder === "oldest") {
        notifications.sort((a, b) => new Date(a.application.date_applied) - new Date(b.application.date_applied));
    } else if (sortOrder === "newest") {
        notifications.sort((a, b) => new Date(b.application.date_applied) - new Date(a.application.date_applied));
    }

    const list = document.getElementById("notifications-page-list");

    if (notifications.length === 0) {
        list.innerHTML = `<div class="notification-empty">No alerts match this filter.</div>`;
        return;
    }

    list.innerHTML = notifications
        .map((n, i) => {
            const linkHtml = n.application.portal_url
                ? `<a href="${n.application.portal_url}" target="_blank" rel="noopener noreferrer" class="btn-portal notification-track-link" data-index="${i}" style="flex-shrink:0;">Track →</a>`
                : "";
            return `
                <div class="notification-item notification-clickable notification-item-row" data-index="${i}">
                    <div class="notification-item-text">
                        <div class="notification-item-title">${n.title}</div>
                        <div class="notification-item-detail">${n.detail}</div>
                    </div>
                    ${linkHtml}
                </div>
            `;
        })
        .join("");

    list.querySelectorAll(".notification-clickable").forEach((item) => {
        item.addEventListener("click", () => {
            document.getElementById("notifications-page-overlay").style.display = "none";
            openViewModal(notifications[Number(item.dataset.index)].application);
        });
    });

    list.querySelectorAll(".notification-track-link").forEach((link) => {
        link.addEventListener("click", (e) => e.stopPropagation());
    });
}

function applyFilters() {
    const searchTerm = document.getElementById("search-input").value.trim().toLowerCase();
    const statusFilter = document.getElementById("status-filter").value;

    const filtered = allApplications.filter((app) => {
        const matchesSearch = app.company_name.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === "" || app.status === statusFilter;
        const matchesView = currentView === "archive"
            ? ARCHIVE_STATUSES.includes(app.status)
            : !ARCHIVE_STATUSES.includes(app.status);
        return matchesSearch && matchesStatus && matchesView;
    });

    renderApplications(filtered);
}

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

function openDeleteModal(id, companyName) {
    pendingDeleteId = id;
    deleteTargetName.textContent = companyName;
    deleteModalOverlay.style.display = "flex";
}

function closeDeleteModal() {
    pendingDeleteId = null;
    deleteModalOverlay.style.display = "none";
}

async function confirmDelete() {
    if (pendingDeleteId === null) return;

    try {
        const response = await fetch(`${API_BASE_URL}/applications/${pendingDeleteId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete application");
        closeDeleteModal();
        fetchApplications();
    } catch (error) {
        closeDeleteModal();
        alert(error.message);
    }
}

async function fetchApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications/`);
        if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
        allApplications = await response.json();
        updateSummary();
        renderNotifications();
        applyFilters();
    } catch (error) {
        console.error("Failed to fetch applications:", error);
    }
}

function renderApplications(applications) {
    const tbody = document.getElementById("applications-body");
    const emptyMessage = document.getElementById("empty-message");

    tbody.innerHTML = "";

    if (applications.length === 0) {
        emptyMessage.textContent = currentView === "archive"
            ? "No rejected or withdrawn applications yet."
            : "No applications yet. Click + Add Application to get started.";
        emptyMessage.style.display = "block";
        return;
    }
    emptyMessage.style.display = "none";

    applications.forEach((app) => {
        const row = document.createElement("tr");
        row.classList.add("clickable-row");
        const portalCell = app.portal_url
            ? `<a href="${app.portal_url}" target="_blank" rel="noopener noreferrer" class="btn btn-portal">Track →</a>`
            : `<span class="empty-value">Not set</span>`;
        const deadlineCell = app.application_deadline
            ? app.application_deadline
            : `<span class="empty-value">No deadline</span>`;

        row.innerHTML = `
            <td>${app.company_name}</td>
            <td>${app.role_title}</td>
            <td>
                <div class="status-selector">
                    <button class="status-badge status-${app.status} status-trigger" data-id="${app.id}">
                        ${app.status.replace(/_/g, " ")}
                    </button>
                    <div class="status-dropdown" data-dropdown-for="${app.id}">
                        ${buildStatusOptions(app.status)}
                    </div>
                </div>
            </td>
            <td>${app.date_applied}</td>
            <td>${deadlineCell}</td>
            <td>${portalCell}</td>
            <td>
                <button class="btn-icon edit-btn" data-id="${app.id}">Edit</button>
                <button class="btn-icon delete-btn" data-id="${app.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
        row.addEventListener("click", () => openViewModal(app));
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            event.stopPropagation();
            const app = applications.find((a) => a.id === Number(btn.dataset.id));
            openModal(app);
        });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            event.stopPropagation();
            const app = applications.find((a) => a.id === Number(btn.dataset.id));
            openDeleteModal(app.id, app.company_name);
        });
    });
    setupStatusDropdowns();
}
const STATUS_OPTIONS = [
    "applied", "under_review", "interview_scheduled",
    "interviewed", "offer", "rejected", "withdrawn"
];

function buildStatusOptions(currentStatus) {
    return STATUS_OPTIONS
        .filter((status) => status !== currentStatus)
        .map((status) => `
            <button class="status-option status-${status}" data-status="${status}">
                ${status.replace(/_/g, " ")}
            </button>
        `)
        .join("");
}

async function updateStatus(applicationId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) throw new Error("Failed to update status");
        fetchApplications();
    } catch (error) {
        alert(error.message);
    }
}

function setupStatusDropdowns() {
    document.querySelectorAll(".status-trigger").forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            event.stopPropagation();
            const dropdown = document.querySelector(`.status-dropdown[data-dropdown-for="${trigger.dataset.id}"]`);
            const isOpen = dropdown.classList.contains("open");
            closeAllStatusDropdowns();
            if (!isOpen) dropdown.classList.add("open");
        });
    });

    document.querySelectorAll(".status-option").forEach((option) => {
        option.addEventListener("click", (event) => {
            event.stopPropagation();
            const dropdown = option.closest(".status-dropdown");
            const applicationId = dropdown.dataset.dropdownFor;
            updateStatus(applicationId, option.dataset.status);
            closeAllStatusDropdowns();
        });
    });
}

function closeAllStatusDropdowns() {
    document.querySelectorAll(".status-dropdown.open").forEach((d) => d.classList.remove("open"));
}

document.addEventListener("click", closeAllStatusDropdowns);
document.addEventListener("click", () => {
    document.getElementById("notification-dropdown").style.display = "none";
});

const viewModalOverlay = document.getElementById("view-modal-overlay");
let currentViewedApplication = null;

document.getElementById("close-view-modal-btn").addEventListener("click", closeViewModal);
document.getElementById("view-close-btn").addEventListener("click", closeViewModal);
document.getElementById("view-edit-btn").addEventListener("click", () => {
    const applicationToEdit = currentViewedApplication;
    closeViewModal();
    openModal(applicationToEdit);
});

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    return date.toLocaleString();
}

function openViewModal(application) {
    currentViewedApplication = application;

    document.getElementById("view-company_name").textContent = application.company_name;
    document.getElementById("view-role_title").textContent = application.role_title;
    document.getElementById("view-status").textContent = application.status.replace(/_/g, " ");
    document.getElementById("view-date_applied").textContent = application.date_applied;
    document.getElementById("view-application_deadline").textContent = application.application_deadline ?? "Not set";
    document.getElementById("view-follow_up_date").textContent = application.follow_up_date ?? "Not set";
    document.getElementById("view-contact_person").textContent = application.contact_person ?? "Not set";
    document.getElementById("view-contact_email").textContent = application.contact_email ?? "Not set";
    document.getElementById("view-reference_number").textContent = application.reference_number ?? "Not set";
    document.getElementById("view-portal_url").textContent = application.portal_url ?? "Not set";
    document.getElementById("view-notes").textContent = application.notes ?? "No notes added.";
    document.getElementById("view-created_at").textContent = formatDateTime(application.created_at);
    document.getElementById("view-updated_at").textContent = formatDateTime(application.updated_at);

    viewModalOverlay.style.display = "flex";
}

function closeViewModal() {
    currentViewedApplication = null;
    viewModalOverlay.style.display = "none";
}

fetchApplications();
