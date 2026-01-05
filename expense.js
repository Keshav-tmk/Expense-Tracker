let currentUser = null;
let expenses = [];
let isLoginMode = true;
let categoryChart = null;
let monthlyChart = null;
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  if (document.getElementById("date")) {
    document.getElementById("date").value = today;
  }

  // Auth Toggle
  document.getElementById("authToggle").addEventListener("click", (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    const nameGroup = document.getElementById("nameGroup");
    const authBtn = document.getElementById("authBtn");
    const authToggleText = document.getElementById("authToggleText");
    const authToggle = document.getElementById("authToggle");

    if (isLoginMode) {
      nameGroup.style.display = "none";
      authBtn.textContent = "Login";
      authToggleText.textContent = "Don't have an account?";
      authToggle.textContent = "Register";
    } else {
      nameGroup.style.display = "block";
      authBtn.textContent = "Register";
      authToggleText.textContent = "Already have an account?";
      authToggle.textContent = "Login";
    }
  });

  // Auth Form
  document.getElementById("authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const name = document.getElementById("name").value;

    if (isLoginMode) {
      // Login
      const userData = localStorage.getItem(`user_${email}`);
      if (userData) {
        const user = JSON.parse(userData);
        if (user.password === password) {
          currentUser = email;
          localStorage.setItem("currentUser", email);
          loadUserData();
          showDashboard();
        } else {
          alert("Invalid password");
        }
      } else {
        alert("User not found. Please register.");
      }
    } else {
      // Register
      const userData = { email, password, name };
      localStorage.setItem(`user_${email}`, JSON.stringify(userData));
      currentUser = email;
      localStorage.setItem("currentUser", email);
      showDashboard();
    }
  });

  // Expense Form
  document.getElementById("expenseForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const date = document.getElementById("date").value;
    const photoInput = document.getElementById("billPhoto");

    const expense = {
      id: Date.now(),
      amount,
      category,
      description,
      date,
      photo: null,
    };

    if (photoInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        expense.photo = e.target.result;
        addExpense(expense);
      };
      reader.readAsDataURL(photoInput.files[0]);
    } else {
      addExpense(expense);
    }
  });

  // Photo Preview
  document.getElementById("billPhoto").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById(
          "photoPreview"
        ).innerHTML = `<img src="${e.target.result}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-top: 10px;">`;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById("chatInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});

function addExpense(expense) {
  expenses.push(expense);
  saveExpenses();
  updateStats();
  renderExpenses();
  renderCharts();
  document.getElementById("expenseForm").reset();
  document.getElementById("photoPreview").innerHTML = "";
  document.getElementById("date").value = new Date()
    .toISOString()
    .split("T")[0];
}

function showDashboard() {
  document.getElementById("authPage").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  const userData = JSON.parse(localStorage.getItem(`user_${currentUser}`));
  document.getElementById("userName").textContent = `Welcome, ${
    userData.name || currentUser
  }`;
  updateStats();
  renderExpenses();
  renderCharts();
}

function loadUserData() {
  const data = localStorage.getItem(`expenses_${currentUser}`);
  if (data) {
    expenses = JSON.parse(data);
  }
}

function saveExpenses() {
  localStorage.setItem(`expenses_${currentUser}`, JSON.stringify(expenses));
}

function updateStats() {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const count = expenses.length;
  const avg = count > 0 ? total / count : 0;

  document.getElementById("totalExpenses").textContent = `₹${total.toFixed(2)}`;
  document.getElementById("totalTransactions").textContent = count;
  document.getElementById("avgTransaction").textContent = `₹${avg.toFixed(2)}`;
}

function renderExpenses() {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";

  expenses
    .slice()
    .reverse()
    .forEach((exp) => {
      const div = document.createElement("div");
      div.className = "expense-item";
      div.innerHTML = `
                    <div class="expense-details">
                        <span class="expense-category">${exp.category}</span>
                        <div class="expense-description">${
                          exp.description
                        }</div>
                        <div class="expense-amount">₹${exp.amount.toFixed(
                          2
                        )}</div>
                        <div class="expense-date">${exp.date}</div>
                        ${
                          exp.photo
                            ? `<img src="${exp.photo}" class="expense-image" onclick="viewImage('${exp.photo}')">`
                            : ""
                        }
                    </div>
                    <button class="delete-btn" onclick="deleteExpense(${
                      exp.id
                    })">Delete</button>
                `;
      list.appendChild(div);
    });
}

function deleteExpense(id) {
  expenses = expenses.filter((exp) => exp.id !== id);
  saveExpenses();
  updateStats();
  renderExpenses();
  renderCharts();
}

function viewImage(src) {
  window.open(src, "_blank");
}

function renderCharts() {
  // Category Chart
  const categoryData = {};
  expenses.forEach((exp) => {
    categoryData[exp.category] = (categoryData[exp.category] || 0) + exp.amount;
  });

  const categoryCtx = document.getElementById("categoryChart").getContext("2d");
  if (categoryChart) categoryChart.destroy();

  if (Object.keys(categoryData).length > 0) {
    categoryChart = new Chart(categoryCtx, {
      type: "pie",
      data: {
        labels: Object.keys(categoryData),
        datasets: [
          {
            data: Object.values(categoryData),
            backgroundColor: [
              "#FF6B6B",
              "#4ECDC4",
              "#45B7D1",
              "#FFA07A",
              "#98D8C8",
              "#F7DC6F",
              "#BB8FCE",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  // Monthly Chart with better visualization
  const monthlyData = {};
  expenses.forEach((exp) => {
    const month = exp.date.substring(0, 7);
    monthlyData[month] = (monthlyData[month] || 0) + exp.amount;
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const monthlyCtx = document.getElementById("monthlyChart").getContext("2d");
  if (monthlyChart) monthlyChart.destroy();

  if (sortedMonths.length > 0) {
    // Format month labels to be more readable
    const monthLabels = sortedMonths.map((m) => {
      const date = new Date(m + "-01");
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    });

    monthlyChart = new Chart(monthlyCtx, {
      type: "line",
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: "Monthly Spending (₹)",
            data: sortedMonths.map((m) => monthlyData[m]),
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.2)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: "#667eea",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "₹" + value.toFixed(0);
              },
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return "Total: ₹" + context.parsed.y.toFixed(2);
              },
            },
          },
        },
      },
    });
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  currentUser = null;
  expenses = [];
  document.getElementById("authPage").style.display = "flex";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("authForm").reset();
}

// Chatbot
function toggleChatbot() {
  const chatbot = document.getElementById("chatbotWindow");
  chatbot.style.display = chatbot.style.display === "flex" ? "none" : "flex";
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  const messagesDiv = document.getElementById("chatMessages");

  // Add user message
  messagesDiv.innerHTML += `<div class="message user">${message}</div>`;
  input.value = "";
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Prepare expense context
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryData = {};
  expenses.forEach((exp) => {
    categoryData[exp.category] = (categoryData[exp.category] || 0) + exp.amount;
  });
  const context = `User has ${
    expenses.length
  } expenses totaling ₹${total.toFixed(2)}. Categories: ${Object.entries(
    categoryData
  )
    .map(([k, v]) => `${k}: ₹${v.toFixed(2)}`)
    .join(", ")}`;

  // Call AI
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `${context}\n\nUser question: ${message}`,
          },
        ],
        system:
          "You are a helpful financial advisor assistant. Provide practical expense management tips, budget suggestions, and financial insights based on the user's spending patterns. Be concise and actionable.",
      }),
    });

    const data = await response.json();
    const aiMessage =
      data.content.find((c) => c.type === "text")?.text ||
      "Sorry, I could not generate a response.";

    messagesDiv.innerHTML += `<div class="message ai">${aiMessage}</div>`;
  } catch (error) {
    messagesDiv.innerHTML += `<div class="message ai">I'm having trouble connecting right now. Please try again.</div>`;
  }

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Check if user is already logged in
const savedUser = localStorage.getItem("currentUser");
if (savedUser) {
  currentUser = savedUser;
  loadUserData();
  showDashboard();
}
function exportPDF() {
  let total = expenses.reduce((sum, e) => sum + e.amount, 0);

  let rows = "";
  expenses.forEach((exp, i) => {
    rows += `
      <tr>
        <td>${i + 1}</td>
        <td>${exp.date}</td>
        <td>${exp.category}</td>
        <td>${exp.description}</td>
        <td>₹${exp.amount.toFixed(2)}</td>
      </tr>
    `;
  });

  const printWindow = window.open("", "", "width=900,height=650");

  printWindow.document.write(`
    <html>
    <head>
      <title>Expense Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: center;
        }
        th {
          background-color: #f2f2f2;
        }
        .summary {
          margin-top: 15px;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <h1>Expense Summary Report</h1>
      <p><b>User:</b> ${currentUser}</p>
      <p class="summary"><b>Total Expenses:</b> ₹${total.toFixed(2)}</p>

      <table>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Category</th>
          <th>Description</th>
          <th>Amount</th>
        </tr>
        ${rows}
      </table>

      <script>
        window.onload = function () {
          window.print();
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
