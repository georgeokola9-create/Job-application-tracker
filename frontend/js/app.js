const API_BASE_URL = "http://localhost:8000";

async function fetchApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications/`);

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

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
        row.innerHTML = `
            <td>${app.company_name}</td>
            <td>${app.role_title}</td>
            <td>${app.status}</td>
            <td>${app.date_applied}</td>
            <td>${app.application_deadline ?? "—"}</td>
        `;
        tbody.appendChild(row);
    });
}

fetchApplications();
