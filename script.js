const FEE = 30;


// ===============================
// PAGE NAVIGATION
// ===============================

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById(pageId);

  if (page) {
    page.classList.add("active");
  }

  window.scrollTo(0, 0);

  if (pageId === "dashboard") {
    loadDashboard();
  }
}


// ===============================
// STUDENT REGISTRATION
// ===============================

const registrationForm =
  document.getElementById("registrationForm");

if (registrationForm) {

  registrationForm.addEventListener("submit", function(e) {

    e.preventDefault();

    const name =
      document.getElementById("studentName").value.trim();

    const roll =
      document.getElementById("rollNumber").value.trim();

    const dob =
      document.getElementById("dob").value;

    const mobile =
      document.getElementById("mobile").value.trim();

    const branch =
      document.getElementById("branch").value;

    if (!name || !roll || !dob || !mobile || !branch) {
      alert("Please fill all details.");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    let students =
      JSON.parse(localStorage.getItem("students")) || [];

    const duplicate = students.some(
      s => String(s.roll || "").toLowerCase() === roll.toLowerCase()
    );

    if (duplicate) {
      alert("This AKTU Roll Number is already registered.");
      return;
    }

    const registrationId =
      "SAQ" + Date.now().toString().slice(-8);

    const student = {
      id: registrationId,
      registrationId: registrationId,
      name: name,
      roll: roll,
      dob: dob,
      mobile: mobile,
      branch: branch,
      fee: FEE,
      utr: "",
      paymentStatus: "Pending Verification",
      registeredAt: new Date().toLocaleString()
    };

    students.push(student);

    localStorage.setItem(
      "students",
      JSON.stringify(students)
    );

    localStorage.setItem(
      "currentStudentId",
      registrationId
    );

    showPage("payment");
  });
}


// ===============================
// PAYMENT
// ===============================

function submitPayment() {

  const utr =
    document.getElementById("utr").value.trim();

  const message =
    document.getElementById("paymentMessage");

  if (!utr) {

    message.innerText =
      "Please enter UTR / Transaction ID.";

    message.style.color = "red";

    return;
  }

  let students =
    JSON.parse(localStorage.getItem("students")) || [];

  const currentId =
    localStorage.getItem("currentStudentId");

  const student =
    students.find(s =>
      s.id === currentId ||
      s.registrationId === currentId
    );

  if (!student) {

    alert("Registration data not found.");
    return;
  }

  student.utr = utr;
  student.paymentStatus = "Pending Verification";

  localStorage.setItem(
    "students",
    JSON.stringify(students)
  );

  document.getElementById("registrationId").innerText =
    student.registrationId || student.id;

  showPage("success");
}


// ===============================
// ADMIN LOGIN
// ===============================

function adminLogin() {

  const username =
    document.getElementById("adminUsername").value.trim();

  const password =
    document.getElementById("adminPassword").value;

  const message =
    document.getElementById("loginMessage");

  if (
    username === "admin" &&
    password === "admin123"
  ) {

    sessionStorage.setItem(
      "adminLoggedIn",
      "true"
    );

    message.innerText = "";

    showPage("dashboard");

  } else {

    message.innerText =
      "Invalid username or password.";

    message.style.color = "red";
  }
}


// ===============================
// ADMIN DASHBOARD
// ===============================

function loadDashboard() {

  if (
    sessionStorage.getItem("adminLoggedIn") !== "true"
  ) {
    showPage("admin");
    return;
  }

  let students =
    JSON.parse(localStorage.getItem("students")) || [];

  // Fix old records
  students = students.map((student, index) => {

    if (!student.id || student.id === "undefined") {

      student.id =
        "SAQ" + String(Date.now() + index).slice(-8);
    }

    if (!student.registrationId) {
      student.registrationId = student.id;
    }

    if (!student.paymentStatus) {
      student.paymentStatus =
        student.utr ? "Pending Verification" : "Submitted";
    }

    return student;
  });

  localStorage.setItem(
    "students",
    JSON.stringify(students)
  );

  const total =
    students.length;

  const pending =
    students.filter(s =>
      s.paymentStatus === "Pending Verification" ||
      s.paymentStatus === "Submitted"
    ).length;

  const verified =
    students.filter(s =>
      s.paymentStatus === "Verified"
    ).length;

  document.getElementById("totalStudents").innerText =
    total;

  document.getElementById("pendingPayments").innerText =
    pending;

  document.getElementById("verifiedPayments").innerText =
    verified;

  createAdminTools();

  renderStudentTable(students);
}


// ===============================
// ADMIN TOOLS
// ===============================

function createAdminTools() {

  const tableContainer =
    document.querySelector(".table-container");

  if (!tableContainer) return;

  if (document.getElementById("adminTools")) {
    return;
  }

  const tools = document.createElement("div");

  tools.id = "adminTools";

  tools.innerHTML = `
    <div style="
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      margin-bottom:15px;
    ">

      <input
        id="studentSearch"
        type="text"
        placeholder="Search name, roll no. or mobile..."
        style="
          flex:1;
          min-width:220px;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
        "
        oninput="searchStudents()"
      >

      <button
        onclick="exportCSV()"
        style="
          padding:12px 16px;
          border:none;
          border-radius:8px;
          background:#3155a4;
          color:white;
          cursor:pointer;
        "
      >
        Export CSV
      </button>

      <button
        onclick="clearAllStudents()"
        style="
          padding:12px 16px;
          border:none;
          border-radius:8px;
          background:#dc3545;
          color:white;
          cursor:pointer;
        "
      >
        Delete All
      </button>

    </div>
  `;

  tableContainer.parentNode.insertBefore(
    tools,
    tableContainer
  );
}


// ===============================
// TABLE
// ===============================

function renderStudentTable(students) {

  const table =
    document.getElementById("studentTable");

  table.innerHTML = "";

  if (students.length === 0) {

    table.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;">
          No registrations found.
        </td>
      </tr>
    `;

    return;
  }

  students.forEach(student => {

    const row =
      document.createElement("tr");

    const id =
      student.registrationId || student.id;

    const status =
      student.paymentStatus || "Pending Verification";

    let statusHTML;

    if (status === "Verified") {

      statusHTML = `
        <span style="
          color:#168447;
          font-weight:bold;
        ">
          Verified
        </span>
      `;

    } else {

      statusHTML = `
        <span style="
          color:#d88a00;
          font-weight:bold;
        ">
          ${escapeHTML(status)}
        </span>
      `;
    }

    row.innerHTML = `

      <td>${escapeHTML(id)}</td>

      <td>
        ${escapeHTML(student.name || "")}
      </td>

      <td>
        ${escapeHTML(student.roll || "")}
      </td>

      <td>
        ${escapeHTML(student.branch || "")}
      </td>

      <td>
        ${escapeHTML(student.mobile || "")}
      </td>

      <td>
        ${escapeHTML(student.utr || "-")}
      </td>

      <td>
        ${statusHTML}
      </td>

      <td style="white-space:nowrap;">

        ${
          status !== "Verified"
          ? `
            <button
              onclick="verifyPayment('${escapeJS(id)}')"
              style="
                background:#168447;
                color:white;
                border:none;
                padding:7px 10px;
                border-radius:6px;
                cursor:pointer;
                margin-right:5px;
              "
            >
              Verify
            </button>
          `
          : ""
        }

        <button
          onclick="deleteStudent('${escapeJS(id)}')"
          style="
            background:#dc3545;
            color:white;
            border:none;
            padding:7px 10px;
            border-radius:6px;
            cursor:pointer;
          "
        >
          Delete
        </button>

      </td>
    `;

    table.appendChild(row);
  });
}


// ===============================
// SEARCH
// ===============================

function searchStudents() {

  const search =
    document.getElementById("studentSearch")
      .value
      .toLowerCase()
      .trim();

  const students =
    JSON.parse(localStorage.getItem("students")) || [];

  const filtered =
    students.filter(student => {

      return (
        String(student.name || "")
          .toLowerCase()
          .includes(search) ||

        String(student.roll || "")
          .toLowerCase()
          .includes(search) ||

        String(student.mobile || "")
          .toLowerCase()
          .includes(search)
      );
    });

  renderStudentTable(filtered);
}


// ===============================
// VERIFY PAYMENT
// ===============================

function verifyPayment(id) {

  let students =
    JSON.parse(localStorage.getItem("students")) || [];

  const student =
    students.find(s =>
      s.id === id ||
      s.registrationId === id
    );

  if (!student) {
    alert("Student not found.");
    return;
  }

  if (!student.utr) {

    alert(
      "UTR / Transaction ID is not available."
    );

    return;
  }

  const confirmPayment =
    confirm(
      "Have you checked the ₹30 payment for UTR:\n\n" +
      student.utr
    );

  if (!confirmPayment) return;

  student.paymentStatus =
    "Verified";

  localStorage.setItem(
    "students",
    JSON.stringify(students)
  );

  loadDashboard();

  alert("Payment verified successfully.");
}


// ===============================
// DELETE ONE STUDENT
// ===============================

function deleteStudent(id) {

  let students =
    JSON.parse(localStorage.getItem("students")) || [];

  const student =
    students.find(s =>
      s.id === id ||
      s.registrationId === id
    );

  if (!student) {
    alert("Student not found.");
    return;
  }

  const confirmDelete =
    confirm(
      "Delete this registration?\n\n" +
      student.name +
      "\n" +
      (student.roll || "")
    );

  if (!confirmDelete) return;

  students =
    students.filter(s =>
      s.id !== id &&
      s.registrationId !== id
    );

  localStorage.setItem(
    "students",
    JSON.stringify(students)
  );

  loadDashboard();
}


// ===============================
// DELETE ALL
// ===============================

function clearAllStudents() {

  const students =
    JSON.parse(localStorage.getItem("students")) || [];

  if (students.length === 0) {
    alert("There are no registrations.");
    return;
  }

  const confirmDelete =
    confirm(
      "WARNING!\n\n" +
      "Delete ALL registrations?\n\n" +
      "This action cannot be undone."
    );

  if (!confirmDelete) return;

  localStorage.removeItem("students");

  loadDashboard();

  alert("All registrations deleted.");
}


// ===============================
// EXPORT CSV
// ===============================

function exportCSV() {

  const students =
    JSON.parse(localStorage.getItem("students")) || [];

  if (students.length === 0) {

    alert("No registrations to export.");
    return;
  }

  const headers = [
    "Registration ID",
    "Name",
    "Roll Number",
    "DOB",
    "Mobile",
    "Branch",
    "Fee",
    "UTR",
    "Payment Status",
    "Registered At"
  ];

  const rows = students.map(student => [

    student.registrationId || student.id || "",

    student.name || "",

    student.roll || "",

    student.dob || "",

    student.mobile || "",

    student.branch || "",

    student.fee || FEE,

    student.utr || "",

    student.paymentStatus || "",

    student.registeredAt || ""

  ]);

  const csv = [
    headers,
    ...rows
  ]
    .map(row =>
      row
        .map(value =>
          `"${String(value).replace(/"/g, '""')}"`
        )
        .join(",")
    )
    .join("\n");

  const blob =
    new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    "smart-aspirant-quiz-registrations.csv";

  link.click();

  URL.revokeObjectURL(url);
}


// ===============================
// LOGOUT
// ===============================

function logout() {

  sessionStorage.removeItem(
    "adminLoggedIn"
  );

  showPage("home");
}


// ===============================
// SECURITY HELPERS
// ===============================

function escapeHTML(value) {

  return String(value)

    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeJS(value) {

  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}
