const FEE = 30;

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");

  window.scrollTo(0, 0);

  if (pageId === "dashboard") {
    loadDashboard();
  }
}


// ===============================
// STUDENT REGISTRATION
// ===============================

document.getElementById("registrationForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("rollNumber").value.trim();
  const dob = document.getElementById("dob").value;
  const mobile = document.getElementById("mobile").value.trim();
  const branch = document.getElementById("branch").value;

  if (!name || !roll || !dob || !mobile || !branch) {
    alert("Please fill all details.");
    return;
  }

  if (!/^[0-9]{10}$/.test(mobile)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  const students = JSON.parse(localStorage.getItem("students")) || [];

  const alreadyRegistered = students.some(
    student => student.roll.toLowerCase() === roll.toLowerCase()
  );

  if (alreadyRegistered) {
    alert("This AKTU Roll Number is already registered.");
    return;
  }

  const registrationId =
    "SAQ" + Date.now().toString().slice(-8);

  const student = {
    id: registrationId,
    name: name,
    roll: roll,
    dob: dob,
    mobile: mobile,
    branch: branch,
    fee: FEE,
    utr: "",
    paymentStatus: "Pending",
    registeredAt: new Date().toLocaleString()
  };

  students.push(student);

  localStorage.setItem("students", JSON.stringify(students));
  localStorage.setItem("currentStudentId", registrationId);

  showPage("payment");
});


// ===============================
// PAYMENT / UTR
// ===============================

function submitPayment() {

  const utrInput = document.getElementById("utr");
  const message = document.getElementById("paymentMessage");

  const utr = utrInput.value.trim();

  if (!utr) {
    message.innerText = "Please enter your UTR / Transaction ID.";
    message.style.color = "red";
    return;
  }

  const students = JSON.parse(localStorage.getItem("students")) || [];

  const currentId =
    localStorage.getItem("currentStudentId");

  const student = students.find(
    s => s.id === currentId
  );

  if (!student) {
    alert("Registration data not found.");
    return;
  }

  student.utr = utr;
  student.paymentStatus = "Pending Verification";

  localStorage.setItem("students", JSON.stringify(students));

  document.getElementById("registrationId").innerText =
    student.id;

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

  /*
    DEMO ADMIN LOGIN

    Username: admin
    Password: admin123

    Production website should use
    secure backend authentication.
  */

  if (username === "admin" && password === "admin123") {

    sessionStorage.setItem("adminLoggedIn", "true");

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

  const loggedIn =
    sessionStorage.getItem("adminLoggedIn");

  if (loggedIn !== "true") {
    showPage("admin");
    return;
  }

  const students =
    JSON.parse(localStorage.getItem("students")) || [];

  document.getElementById("totalStudents").innerText =
    students.length;

  const pending =
    students.filter(
      s => s.paymentStatus === "Pending Verification"
    ).length;

  const verified =
    students.filter(
      s => s.paymentStatus === "Verified"
    ).length;

  document.getElementById("pendingPayments").innerText =
    pending;

  document.getElementById("verifiedPayments").innerText =
    verified;

  const table =
    document.getElementById("studentTable");

  table.innerHTML = "";

  if (students.length === 0) {

    table.innerHTML = `
      <tr>
        <td colspan="8">
          No registrations yet.
        </td>
      </tr>
    `;

    return;
  }

  students.forEach(student => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${student.id}</td>
      <td>${escapeHTML(student.name)}</td>
      <td>${escapeHTML(student.roll)}</td>
      <td>${escapeHTML(student.branch)}</td>
      <td>${escapeHTML(student.mobile)}</td>
      <td>${student.utr || "-"}</td>
      <td>
        <strong>${student.paymentStatus}</strong>
      </td>
      <td>
        ${
          student.paymentStatus !== "Verified"
          ? `<button onclick="verifyPayment('${student.id}')">
               Verify
             </button>`
          : `<span>Verified</span>`
        }
      </td>
    `;

    table.appendChild(row);
  });
}


// ===============================
// VERIFY PAYMENT
// ===============================

function verifyPayment(id) {

  const students =
    JSON.parse(localStorage.getItem("students")) || [];

  const student =
    students.find(s => s.id === id);

  if (!student) {
    alert("Student not found.");
    return;
  }

  if (!student.utr) {
    alert("UTR is not available.");
    return;
  }

  const confirmVerify =
    confirm(
      "Have you checked the ₹30 payment for UTR: " +
      student.utr +
      "?"
    );

  if (!confirmVerify) return;

  student.paymentStatus = "Verified";

  localStorage.setItem(
    "students",
    JSON.stringify(students)
  );

  loadDashboard();

  alert("Payment verified successfully.");
}


// ===============================
// LOGOUT
// ===============================

function logout() {

  sessionStorage.removeItem("adminLoggedIn");

  showPage("home");
}


// ===============================
// BASIC HTML SAFETY
// ===============================

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
