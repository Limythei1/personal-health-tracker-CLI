// --- App state helpers ---
function saveUsers(users) {
  localStorage.setItem('phet_users', JSON.stringify(users));
}

function loadUsers() {
  return JSON.parse(localStorage.getItem('phet_users') || '{}');
}

function saveCurrent(email) {
  localStorage.setItem('phet_current', email);
}

function loadCurrent() {
  return localStorage.getItem('phet_current');
}

function getUserData(email) {
  const users = loadUsers();
  if (users[email]) return users[email];
  return { username: '', password: '', budget: 10000, records: { food: [], transport: [], gadget: [] } };
}

function saveUserData(email, data) {
  const users = loadUsers();
  users[email] = data;
  saveUsers(users);
}

// --- UI elements ---
const landing = document.getElementById('landing');
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const dashboard = document.getElementById('dashboard');

// auth buttons
document.getElementById('showSignup').onclick = () => {
  landing.classList.add('hidden');
  signupForm.classList.remove('hidden');
};

document.getElementById('showLogin').onclick = () => {
  landing.classList.add('hidden');
  loginForm.classList.remove('hidden');
};

document.getElementById('backFromSignup').onclick = () => {
  signupForm.classList.add('hidden');
  landing.classList.remove('hidden');
};

document.getElementById('backFromLogin').onclick = () => {
  loginForm.classList.add('hidden');
  landing.classList.remove('hidden');
};

// signup
document.getElementById('doSignup').onclick = () => {
  const email = document.getElementById('suEmail').value.trim();
  const username = document.getElementById('suUser').value.trim();
  const password = document.getElementById('suPass').value;

  if (!email || !username || !password) {
    document.getElementById('suMsg').textContent = 'All fields are required.';
    return;
  }
  if (!email.includes('@gmail.com')) {
    document.getElementById('suMsg').textContent = 'Email must include @gmail.com for demo.';
    return;
  }
  if (username.length < 8) {
    document.getElementById('suMsg').textContent = 'Username must be at least 8 characters.';
    return;
  }
  if (password.length < 6) {
    document.getElementById('suMsg').textContent = 'Password must be at least 6 characters.';
    return;
  }

  const users = loadUsers();
  if (users[email]) {
    document.getElementById('suMsg').textContent = 'Account already exists.';
    return;
  }

  users[email] = { username, password, budget: 10000, records: { food: [], transport: [], gadget: [] } };
  saveUsers(users);

  document.getElementById('suMsg').textContent = 'Account created. Logging in...';
  setTimeout(() => { loginUser(email); }, 700);
};

// login
document.getElementById('doLogin').onclick = () => {
  const email = document.getElementById('liEmail').value.trim();
  const password = document.getElementById('liPass').value;
  const users = loadUsers();

  if (users[email] && users[email].password === password) {
    loginUser(email);
  } else {
    document.getElementById('liMsg').textContent = 'No record found or wrong password.';
  }
};

function loginUser(email) {
  saveCurrent(email);
  const data = getUserData(email);
  document.getElementById('welcomeUser').textContent = `Welcome, ${data.username}`;
  signupForm.classList.add('hidden');
  loginForm.classList.add('hidden');
  landing.classList.add('hidden');
  dashboard.classList.remove('hidden');
  renderUser(email);
}

document.getElementById('logout').onclick = () => {
  localStorage.removeItem('phet_current');
  dashboard.classList.add('hidden');
  landing.classList.remove('hidden');
};

document.getElementById('deleteAccount').onclick = () => {
  const email = loadCurrent();
  if (!email) return;
  if (!confirm('Delete account and data?')) return;

  const users = loadUsers();
  delete users[email];
  saveUsers(users);
  localStorage.removeItem('phet_current');
  alert('Account deleted');
  dashboard.classList.add('hidden');
  landing.classList.remove('hidden');
};

// Add expense
function renderUser(email) {
  const data = getUserData(email);
  const sel = document.getElementById('categorySelect');
  sel.innerHTML = '';

  for (const cat of Object.keys(data.records)) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  }

  document.getElementById('budgetInput').value = data.budget || 10000;
  renderSummary(email);
  renderExpenses(email);
}

document.getElementById('newCatBtn').onclick = () => {
  const name = prompt('New category name:');
  if (!name) return;
  const email = loadCurrent();
  const data = getUserData(email);
  if (data.records[name]) {
    alert('Category exists');
  } else {
    data.records[name] = [];
    saveUserData(email, data);
    renderUser(email);
  }
};

document.getElementById('addBtn').onclick = () => {
  const email = loadCurrent();
  if (!email) return alert('Please login');
  const data = getUserData(email);
  const cat = document.getElementById('categorySelect').value;
  const amt = parseFloat(document.getElementById('amount').value);
  const note = document.getElementById('note').value.trim();

  if (isNaN(amt) || amt <= 0) {
    document.getElementById('addMsg').textContent = 'Enter a valid amount.';
    return;
  }

  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const entry = { amount: amt, time: ts, note };
  data.records[cat].push(entry);
  saveUserData(email, data);

  document.getElementById('addMsg').textContent = 'Saved.';
  setTimeout(() => { document.getElementById('addMsg').textContent = ''; }, 900);
  document.getElementById('amount').value = '';
  document.getElementById('note').value = '';
  renderUser(email);

  const tot = calcTotal(data.records);
  if (tot > data.budget) {
    alert(`⚠️ You have gone over your budget by ₦${(tot - data.budget).toFixed(2)}`);
  }
};

function calcTotal(records) {
  let t = 0;
  for (const arr of Object.values(records)) {
    for (const e of arr) t += Number(e.amount || 0);
  }
  return t;
}

function renderSummary(email) {
  const data = getUserData(email);
  const total = calcTotal(data.records);
  const entries = Object.values(data.records).reduce((s, a) => s + a.length, 0);

  document.getElementById('statTotal').textContent = `₦${total.toFixed(2)}`;
  document.getElementById('statEntries').textContent = entries;
  document.getElementById('statRemain').textContent = `₦${(data.budget - total).toFixed(2)}`;

  const sb = document.getElementById('summaryBox');
  sb.innerHTML = '';

  for (const [cat, arr] of Object.entries(data.records)) {
    const div = document.createElement('div');
    div.className = 'expense-row';
    div.innerHTML = `
      <div>
        <div class='category-chip'>${cat}</div>
        <div class='small muted'>${arr.length} entries</div>
      </div>
      <div>₦${(arr.reduce((s, e) => s + Number(e.amount || 0), 0)).toFixed(2)}</div>
    `;
    sb.appendChild(div);
  }
}

function renderExpenses(email) {
  const data = getUserData(email);
  const list = document.getElementById('expensesList');
  list.innerHTML = '';

  for (const [cat, arr] of Object.entries(data.records)) {
    for (const e of arr.slice().reverse()) {
      const row = document.createElement('div');
      row.className = 'expense-row';
      row.innerHTML = `
        <div>
          <strong>${cat}</strong>
          <div class='small muted'>${e.note || ''}</div>
        </div>
        <div>
          ₦${Number(e.amount).toFixed(2)}
          <div class='small muted'>${e.time}</div>
        </div>
      `;
      list.appendChild(row);
    }
  }
}

document.getElementById('setBudget').onclick = () => {
  const email = loadCurrent();
  if (!email) return;
  const data = getUserData(email);
  const b = parseFloat(document.getElementById('budgetInput').value);

  if (isNaN(b) || b <= 0) {
    document.getElementById('budgetMsg').textContent = 'Enter valid budget';
    return;
  }

  data.budget = b;
  saveUserData(email, data);
  document.getElementById('budgetMsg').textContent = 'Budget saved.';
  setTimeout(() => { document.getElementById('budgetMsg').textContent = ''; }, 900);
  renderSummary(email);
};

document.getElementById('searchBtn').onclick = () => {
  const q = document.getElementById('searchInput').value.trim();
  // You can complete search logic here
};