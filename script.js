const API_URL = "https://script.google.com/macros/s/AKfycbw0NABs618Ll2X99pR89J2_zakgTmyIZ3nbdFGMn-MnTtS8Ece6-dI8Q4yHWSs6Q1KA/exec"; // Replace with your Apps Script URL
let tableData = [];
let updatedRows = new Set(); // Track rows we just updated

// Fetch data from Google Sheets
async function fetchData() {
  try {
    console.log("Fetching data...");
    const response = await fetch(API_URL + "?getData=true");
    const data = await response.json();
    tableData = data;
    buildTable(tableData);
    updateLastUpdated();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Build table dynamically
function buildTable(rows) {
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";
  const filterValue = document.getElementById("statusFilter").value;

  rows.slice(1).forEach((row, index) => {
    if (filterValue !== "All" && row[4] !== filterValue) return;

    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell || "";
      tr.appendChild(td);
    });

    // Dynamic Update Column
    const actionTd = document.createElement("td");
    const rowNumber = index + 2;

    if (row[4] === "Checked Out") {
      if (updatedRows.has(rowNumber)) {
        actionTd.textContent = "Completed"; // Keep as Completed if we updated it
      } else {
        actionTd.innerHTML = `
          <button onclick="updateStatus(event, ${rowNumber}, 'Returned')">Collect</button>
        `;
      }
    } else if (row[4] === "Returned") {
      actionTd.textContent = "Completed";
    } else {
      actionTd.textContent = "-";
    }

    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
}

// Update status instantly
async function updateStatus(event, row, status) {
  updatedRows.add(row); // Mark this row as updated
  const button = event.target;
  button.outerHTML = "Completed"; // Show immediately

  try {
    await fetch(API_URL + `?updateStatus=true&row=${row}&status=${encodeURIComponent(status)}`);
    console.log(`Updated row ${row} to ${status}`);
    fetchData(); // Refresh table after update
  } catch (error) {
    console.error("Error updating status:", error);
  }
}

// Show last updated time in Indian timezone
function updateLastUpdated() {
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const indianTime = new Intl.DateTimeFormat('en-IN', options).format(now);
  document.getElementById("lastUpdated").textContent = `Last updated: ${indianTime}`;
}

// Search function
function searchTable() {
  const filter = document.getElementById("search").value.toLowerCase();
  const rows = document.querySelectorAll("#dataTable tbody tr");
  rows.forEach(row => {
    row.style.display = [...row.cells].some(cell =>
      cell.textContent.toLowerCase().includes(filter)
    ) ? "" : "none";
  });
}

// Filter by status
function applyFilter() {
  buildTable(tableData);
}

// Sort by clicking headers
document.querySelectorAll("#dataTable th").forEach((th, i) => {
  th.addEventListener("click", () => {
    if (i >= 6) return; // Ignore Update column
    tableData = [tableData[0]].concat(
      tableData.slice(1).sort((a, b) => (a[i] > b[i] ? 1 : -1))
    );
    buildTable(tableData);
  });
});

// Initial load
fetchData();

// Auto-refresh every 2 seconds
setInterval(fetchData, 2000);
