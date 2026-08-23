/* ==========================================================================
   Shared Life Hub - Application Logic & Real-time Firebase Firestore Sync
   ========================================================================== */

// Application State
let currentUser = null;
let userProfile = null;
let coupleData = null;
let currentViewMode = 'all';
let isSignUpMode = false;

let transactions = [];
let expensesChartInstance = null;
let unsubscribeTransactions = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initChart();
  setupAuthListener();
  registerServiceWorker();
});

/* ==========================================================================
   FIREBASE AUTHENTICATION & PAIRING SYSTEM
   ========================================================================== */

function setupAuthListener() {
  auth.onAuthStateChanged(async (user) => {
    const authScreen = document.getElementById('auth-screen');
    const authLoginCard = document.getElementById('auth-card-login');
    const authLinkCard = document.getElementById('auth-card-link');
    const partnerStatus = document.getElementById('partner-status');
    const statusDot = document.getElementById('status-dot');

    if (!user) {
      // User is logged out
      currentUser = null;
      userProfile = null;
      coupleData = null;
      if (unsubscribeTransactions) unsubscribeTransactions();
      
      authScreen.style.display = 'flex';
      authLoginCard.style.display = 'block';
      authLinkCard.style.display = 'none';
      return;
    }

    currentUser = user;

    // Fetch or initialize user document in Firestore
    const userRef = db.collection('users').doc(user.uid);
    let doc = await userRef.get();

    if (!doc.exists) {
      // Create user document with unique coupleCode
      const coupleCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      userProfile = {
        uid: user.uid,
        email: user.email,
        coupleCode: coupleCode,
        coupleId: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await userRef.set(userProfile);
    } else {
      userProfile = doc.data();
    }

    // Check if user is linked to a couple
    if (!userProfile.coupleId) {
      // Show Link Screen
      authScreen.style.display = 'flex';
      authLoginCard.style.display = 'none';
      authLinkCard.style.display = 'block';
      document.getElementById('my-couple-code').innerText = userProfile.coupleCode;
      return;
    }

    // User is logged in and linked!
    authScreen.style.display = 'none';

    // Fetch Couple Document
    const coupleDoc = await db.collection('couples').doc(userProfile.coupleId).get();
    if (coupleDoc.exists) {
      coupleData = coupleDoc.data();
      partnerStatus.innerText = '💖 Pareja Conectada';
      statusDot.style.backgroundColor = '#10b981';
      statusDot.style.boxShadow = '0 0 8px #10b981';
    } else {
      partnerStatus.innerText = '🔒 Solo Personal';
    }

    // Start Real-Time Firestore Sync
    startRealtimeSync();
  });
}

// Toggle between Login & Sign Up
function toggleAuthMode() {
  isSignUpMode = !isSignUpMode;
  const title = document.getElementById('btn-auth-submit');
  const msg = document.getElementById('auth-toggle-msg');
  const btn = document.getElementById('auth-toggle-btn');
  document.getElementById('auth-error').style.display = 'none';

  if (isSignUpMode) {
    title.innerText = 'Crear Cuenta Gratis';
    msg.innerText = '¿Ya tienes cuenta?';
    btn.innerText = 'Inicia sesión';
  } else {
    title.innerText = 'Iniciar Sesión';
    msg.innerText = '¿No tienes cuenta?';
    btn.innerText = 'Regístrate gratis';
  }
}

// Email Auth Handler
async function handleEmailAuth(event) {
  event.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');

  errorEl.style.display = 'none';

  try {
    if (isSignUpMode) {
      await auth.createUserWithEmailAndPassword(email, password);
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
  } catch (err) {
    errorEl.innerText = err.message || 'Error al autenticar. Verifica tus datos.';
    errorEl.style.display = 'block';
  }
}

// Sign Out
function handleSignOut() {
  auth.signOut();
}

// Copy Couple Code to Clipboard
function copyCoupleCode() {
  const code = document.getElementById('my-couple-code').innerText;
  navigator.clipboard.writeText(code);
  alert(`¡Código ${code} copiado al portapapeles! Compártelo con tu pareja.`);
}

// Link Partner using Code
async function handleLinkPartner(event) {
  event.preventDefault();
  const partnerCode = document.getElementById('partner-code-input').value.trim().toUpperCase();
  const errorEl = document.getElementById('link-error');
  errorEl.style.display = 'none';

  if (partnerCode === userProfile.coupleCode) {
    errorEl.innerText = 'No puedes ingresar tu propio código. Debes ingresar el código de tu pareja.';
    errorEl.style.display = 'block';
    return;
  }

  try {
    // Search user with partnerCode
    const snapshot = await db.collection('users').where('coupleCode', '==', partnerCode).get();

    if (snapshot.empty) {
      errorEl.innerText = 'Código no encontrado. Verifica que tu pareja te lo haya compartido bien.';
      errorEl.style.display = 'block';
      return;
    }

    const partnerUserDoc = snapshot.docs[0];
    const partnerData = partnerUserDoc.data();

    // Create new Shared Couple Space ID
    const newCoupleId = `couple_${userProfile.uid.substring(0,5)}_${partnerData.uid.substring(0,5)}`;

    // Create Couple Document
    await db.collection('couples').doc(newCoupleId).set({
      coupleId: newCoupleId,
      users: [userProfile.uid, partnerData.uid],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update both user profiles with coupleId
    await db.collection('users').doc(userProfile.uid).update({ coupleId: newCoupleId });
    await db.collection('users').doc(partnerData.uid).update({ coupleId: newCoupleId });

    alert('🎉 ¡Cuentas vinculadas con éxito! Ahora ambos comparten el espacio de pareja.');
    location.reload();

  } catch (err) {
    errorEl.innerText = 'Error al vincular cuentas. Inténtalo de nuevo.';
    errorEl.style.display = 'block';
  }
}

/* ==========================================================================
   REAL-TIME FIRESTORE TRANSACTIONS SYNC
   ========================================================================== */

function startRealtimeSync() {
  if (!currentUser) return;

  // Query transactions where owner is user OR coupleId matches
  let query = db.collection('transactions');

  unsubscribeTransactions = query.onSnapshot((snapshot) => {
    transactions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      
      // Filter locally for security: show if owner or shared couple
      if (data.uid === currentUser.uid || (userProfile.coupleId && data.coupleId === userProfile.coupleId)) {
        transactions.push(data);
      }
    });

    renderDashboardData();
  });
}

// View Switcher (All / Personal / Couple)
function switchView(viewMode) {
  currentViewMode = viewMode;
  const btnAll = document.getElementById('btn-view-all');
  const btnPersonal = document.getElementById('btn-view-personal');
  const btnCouple = document.getElementById('btn-view-couple');
  const badge = document.getElementById('financial-scope-badge');

  [btnAll, btnPersonal, btnCouple].forEach(btn => btn.classList.remove('active', 'couple-active'));

  if (viewMode === 'all') {
    btnAll.classList.add('active');
    badge.innerText = 'Cuentas Compartidas & Personales';
  } else if (viewMode === 'personal') {
    btnPersonal.classList.add('active');
    badge.innerText = '🔒 Solo Vista Personal';
  } else if (viewMode === 'couple') {
    btnCouple.classList.add('couple-active');
    badge.innerText = '💖 Solo Vista Compartida Pareja';
  }

  renderDashboardData();
}

// Render Dashboard Data
function renderDashboardData() {
  const filteredTx = transactions.filter(tx => {
    if (currentViewMode === 'all') return true;
    return tx.scope === currentViewMode;
  });

  let incomeTotal = 0;
  let expenseTotal = 0;
  const categoryTotals = {
    'Hogar & Servicios': 0,
    'Mercado': 0,
    'Entretenimiento': 0,
    'Ahorros': 0,
    'Otros': 0
  };

  filteredTx.forEach(tx => {
    if (tx.type === 'income') {
      incomeTotal += tx.amount;
    } else {
      expenseTotal += tx.amount;
      if (categoryTotals[tx.category] !== undefined) {
        categoryTotals[tx.category] += tx.amount;
      } else {
        categoryTotals['Otros'] += tx.amount;
      }
    }
  });

  const balanceTotal = incomeTotal - expenseTotal;
  const fmt = val => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  document.getElementById('total-balance').innerText = fmt(balanceTotal);
  document.getElementById('total-income').innerText = `+${fmt(incomeTotal)}`;
  document.getElementById('total-expenses').innerText = `-${fmt(expenseTotal)}`;

  // Render Transaction List
  const listEl = document.getElementById('transactions-list');
  listEl.innerHTML = '';

  if (filteredTx.length === 0) {
    listEl.innerHTML = `<div style="text-align: center; color: var(--text-dim); font-size: 0.85rem; padding: 1rem;">No hay movimientos registrados aún.</div>`;
  } else {
    filteredTx.slice().reverse().forEach(tx => {
      const item = document.createElement('div');
      item.className = `tx-item ${tx.type}`;
      const scopeIcon = tx.scope === 'couple' ? '💖' : '🔒';
      const typeSign = tx.type === 'income' ? '+' : '-';
      const splitBadge = (tx.scope === 'couple' && tx.type === 'expense') ? ` • Split ${tx.split}` : '';

      item.innerHTML = `
        <div>
          <strong>${tx.description}</strong>
          <div class="tx-meta">${scopeIcon} ${tx.category}${splitBadge}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="tx-amount">${typeSign}${fmt(tx.amount)}</span>
          <button onclick="deleteTransaction('${tx.id}')" style="background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 0.9rem;" title="Eliminar">&times;</button>
        </div>
      `;
      listEl.appendChild(item);
    });
  }

  updateChartData(categoryTotals);
}

// Chart.js Setup
function initChart() {
  const ctx = document.getElementById('expensesChart').getContext('2d');
  
  expensesChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Hogar & Servicios', 'Mercado', 'Entretenimiento', 'Ahorros', 'Otros'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#94a3b8'],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } }
        }
      },
      cutout: '70%'
    }
  });
}

function updateChartData(categoryTotals) {
  if (!expensesChartInstance) return;
  expensesChartInstance.data.datasets[0].data = [
    categoryTotals['Hogar & Servicios'],
    categoryTotals['Mercado'],
    categoryTotals['Entretenimiento'],
    categoryTotals['Ahorros'],
    categoryTotals['Otros']
  ];
  expensesChartInstance.update();
}

// Transaction Modal Controls
function openTransactionModal() {
  document.getElementById('modal-backdrop').classList.add('open');
  toggleSplitOptions();
}

function closeTransactionModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
  document.getElementById('transaction-form').reset();
}

function toggleSplitOptions() {
  const isExpense = document.getElementById('type-expense').checked;
  const scope = document.getElementById('tx-scope').value;
  const splitGroup = document.getElementById('split-group');

  splitGroup.style.display = (isExpense && scope === 'couple') ? 'block' : 'none';
}

// Save Transaction to Firestore
async function handleSaveTransaction(event) {
  event.preventDefault();
  if (!currentUser) return;
  
  const type = document.querySelector('input[name="type"]:checked').value;
  const description = document.getElementById('tx-description').value.trim();
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const category = document.getElementById('tx-category').value;
  const scope = document.getElementById('tx-scope').value;
  const split = document.getElementById('tx-split').value;

  if (!description || isNaN(amount) || amount <= 0) return;

  const newTx = {
    uid: currentUser.uid,
    coupleId: scope === 'couple' ? (userProfile.coupleId || null) : null,
    type,
    description,
    amount,
    category,
    scope,
    split: (scope === 'couple' && type === 'expense') ? split : '100-0',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('transactions').add(newTx);
    closeTransactionModal();
  } catch (err) {
    alert('Error al guardar movimiento en Firebase.');
  }
}

// Delete Transaction from Firestore
async function deleteTransaction(docId) {
  if (!confirm('¿Deseas eliminar este movimiento?')) return;
  try {
    await db.collection('transactions').doc(docId).delete();
  } catch (err) {
    alert('Error al eliminar movimiento.');
  }
}

// Habit Controls
function toggleHabit(button) {
  button.classList.toggle('completed');
  button.innerText = button.classList.contains('completed') ? '✓' : '';
}

function addHabitPrompt() {
  const title = prompt('Escribe el título del nuevo hábito:');
  if (title) {
    const list = document.getElementById('habits-list');
    const newItem = document.createElement('div');
    newItem.className = 'habit-item';
    newItem.innerHTML = `
      <div class="habit-info">
        <h4>⚡ ${title}</h4>
        <div class="habit-streak">🔥 1 día seguido • 🔒 Personal</div>
      </div>
      <button class="habit-check-btn" onclick="toggleHabit(this)"></button>
    `;
    list.appendChild(newItem);
  }
}

// Task Controls
function addTaskPrompt() {
  const title = prompt('Escribe el título de la tarea:');
  if (title) {
    const list = document.getElementById('tasks-list');
    const newItem = document.createElement('div');
    newItem.className = 'task-item';
    newItem.innerHTML = `
      <div>
        <strong style="font-size: 0.95rem;">📌 ${title}</strong>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Asignado a: Mí • 🔒 Personal</div>
      </div>
      <input type="checkbox" style="width: 18px; height: 18px; cursor: pointer;">
    `;
    list.appendChild(newItem);
  }
}

// Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker registrado:', reg.scope))
      .catch(err => console.log('Error Service Worker:', err));
  }
}
