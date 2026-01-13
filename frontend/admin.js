const API_URL = 'https://kerygma-report.onrender.com'; // In dev, we can change this, but for now assuming prod url or local proxy

// const API_URL = 'http://localhost:3001'; // In dev, we can change this, but for now assuming prod url or local proxy

// STATE
let currentReports = [];

// ELEMENTS
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const dateRangeSelect = document.getElementById('date-range');
const hallFilterSelect = document.getElementById('hall-filter');
const exportBtn = document.getElementById('export-btn');

const totalAttendanceEl = document.getElementById('total-attendance');
const totalNewSoulsEl = document.getElementById('total-new-souls');
const totalTestimoniesEl = document.getElementById('total-testimonies');
const tableBody = document.getElementById('reports-table-body');

// --- INIT ---
function init() {
    const token = localStorage.getItem('kerygma_admin_token');
    if (token) {
        showDashboard();
    }
}

// --- AUTHENTICATION ---
loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('kerygma_admin_token', data.token);
            showDashboard();
        } else {
            alert('❌ Login Failed: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        console.error(err);
        alert('❌ Network Error');
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('kerygma_admin_token');
    location.reload();
});

function showDashboard() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    fetchReports(); // Load data
}

// --- DATA FETCHING ---
async function fetchReports() {
    const token = localStorage.getItem('kerygma_admin_token');
    if (!token) return;

    // Build Query
    const params = new URLSearchParams();

    // Date Logic
    const today = new Date();
    const range = dateRangeSelect.value;

    if (range === 'today') {
        params.append('start_date', formatDate(today));
        params.append('end_date', formatDate(today));
    } else if (range === 'this-week') {
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay())); // Sunday
        params.append('start_date', formatDate(firstDay));
        // End date is effectively today/future, we can leave it open or set to today
    } else if (range === 'this-month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        params.append('start_date', formatDate(firstDay));
    }
    // 'all-time' sends no date params

    if (hallFilterSelect.value) {
        params.append('hall', hallFilterSelect.value);
    }

    try {
        const res = await fetch(`${API_URL}/api/reports?${params.toString()}`, {
            headers: {
                'x-admin-token': token
            }
        });

        if (res.status === 401) {
            alert('Session expired');
            localStorage.removeItem('kerygma_admin_token');
            location.reload();
            return;
        }

        const data = await res.json();
        currentReports = data;
        renderDashboard();

    } catch (err) {
        console.error(err);
        alert('Failed to load reports');
    }
}

// --- RENDERING ---
function renderDashboard() {
    // 1. Update Metrics
    let attendance = 0;
    let newSouls = 0;
    let testimonies = 0;

    currentReports.forEach(r => {
        attendance += (r.total_attendees || 0);
        newSouls += (r.new_attendees || 0);
        testimonies += (r.testimonies || 0);
    });

    totalAttendanceEl.innerText = attendance;
    totalNewSoulsEl.innerText = newSouls;
    totalTestimoniesEl.innerText = testimonies;

    // 2. Render Table
    tableBody.innerHTML = '';
    currentReports.forEach((report, index) => {
        const row = document.createElement('tr');
        row.className = 'report-row';
        row.innerHTML = `
            <td>${report.meeting_date}</td>
            <td>${report.coordinator}</td>
            <td><span class="badge">${formatHall(report.hall)}</span></td>
            <td>${report.total_attendees}</td>
            <td>${report.new_attendees}</td>
        `;

        // Details Row
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row';
        detailsRow.id = `details-${index}`;
        detailsRow.innerHTML = `
            <td colspan="5">
                <div class="details-content">
                    <strong>Attendees:</strong>
                    <p>${report.attendee_names || 'None listed'}</p>
                    <br>
                    <strong>Testimonies:</strong>
                    <p>${report.testimonies > 0 ? 'See database for details (text field not in basic fetch example)' : 'None'}</p> 
                    <!-- Note: In the fetch, we select *, so if there was a text column for testimonies we'd show it. 
                         Since the original form only had a NUMBER for testimonies, we just show that. 
                         Wait, the original form had 'names' textarea, but 'testimonies' was a NUMBER input. 
                         So there is no testimony text to show unless I missed it. 
                         Re-checking input: yes, testimonies is number. names is textarea. -->
                </div>
            </td>
        `;

        // Click to toggle
        row.addEventListener('click', () => {
            const isOpen = detailsRow.classList.contains('open');
            // Close all others (optional, but cleaner)
            document.querySelectorAll('.details-row').forEach(r => r.classList.remove('open'));

            if (!isOpen) {
                detailsRow.classList.add('open');
            }
        });

        tableBody.appendChild(row);
        tableBody.appendChild(detailsRow);
    });
}

// --- FILTERS ---
dateRangeSelect.addEventListener('change', fetchReports);
hallFilterSelect.addEventListener('change', fetchReports);

// --- EXPORT ---
exportBtn.addEventListener('click', () => {
    if (currentReports.length === 0) {
        alert("No data to export");
        return;
    }

    const headers = ["Date", "Coordinator", "Hall", "Total Attendees", "New Souls", "Testimonies", "Names"];
    const rows = currentReports.map(r => [
        r.meeting_date,
        r.coordinator,
        r.hall,
        r.total_attendees,
        r.new_attendees,
        r.testimonies,
        `"${(r.attendee_names || '').replace(/\n/g, ' ')}"` // Escape quotes? simplified
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kerygma_reports_${formatDate(new Date())}.csv`;
    a.click();
});

// --- UTILS ---
function formatDate(date) {
    // Returns YYYY-MM-DD
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function formatHall(slug) {
    if (!slug) return slug;
    // 'daniel-hall' -> 'Daniel Hall'
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Start
init();
