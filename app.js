/* ==========================================================================
   Shared Life Hub - Application Logic
   Handles: Transactions State, Modal UI, Dynamic Balances, Chart.js & PWA
   ========================================================================== */

// Initial Financial State (Demo Data)
let currentViewMode = 'all';

let transactions = [
  { id: 1, type: 'income', description: 'Sueldo Mensual', amount: 5800.00, category: 'Ahorros', scope: 'personal', split: '100-0', date: '2026-08-01' },
  { id: 2, type: 'expense', description: 'Arriendo / Servicios', amount: 450.00, category: 'Hogar & Servicios', scope: 'couple', split: '50-50', date: '2026-08-05' },
  { id: 3, type: 'expense', description: 'Mercado Semanal', amount: 600.00, category: 'Mercado', scope: 'couple', split: '60-40', date: '2026-08-10' },
  { id: 4, type: 'expense', description: 'Cena & Cine Pareja', amount: 200.00, category: 'Entretenimiento', scope: 'couple', split: '50-50', date: '2026-08-14' },
  { id: 5, type: 'expense', description: 'Fondo de Emergencia', amount: 300.00, category: 'Ahorros', scope: 'personal', split: '100-0', date: '2026-08-15' }
];

let expensesChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  initChart();
  renderDashboardData();
  registerServiceWorker();
});

// View Switcher (All / Personal / Couple)
function switchView(viewMode) {
  currentViewMode = viewMode;
  const btnAll = document.getElementById('btn-view-all');
  const btnPersonal = document.getElementById('btn-view-personal');
  const btnCouple = document.getElementById('btn-view-couple');
  const badge = document.getElementById('financial-scope-badge');

  // Reset active classes
  [btnAll, btnPersonal, btnCouple].forEach(btn => {
    btn.classList.remove('active', 'couple-active');
  });

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

// Render Dashboard (Totals, List, Chart)
function renderDashboardData() {
  const filteredTx = transactions.filter(tx => {
    if (currentViewMode === 'all') return true;
    return tx.scope === currentViewMode;
  });

  // Calculate Totals
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

  // Format currency helper
  const fmt = val => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  document.getElementById('total-balance').innerText = fmt(balanceTotal);
  document.getElementById('total-income').innerText = `+${fmt(incomeTotal)}`;
  document.getElementById('total-expenses').innerText = `-${fmt(expenseTotal)}`;

  // Render Transaction List
  const listEl = document.getElementById('transactions-list');
  listEl.innerHTML = '';

  if (filteredTx.length === 0) {
    listEl.innerHTML = `<div style="text-align: center; color: var(--text-dim); font-size: 0.85rem; padding: 1rem;">No hay movimientos en esta vista.</div>`;
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
          <button onclick="deleteTransaction(${tx.id})" style="background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 0.9rem;" title="Eliminar">&times;</button>
        </div>
      `;
      listEl.appendChild(item);
    });
  }

  // Update Chart
  updateChartData(categoryTotals);
}

// Chart.js Initialization
function initChart() {
  const ctx = document.getElementById('expensesChart').getContext('2d');

  expensesChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Hogar & Servicios', 'Mercado', 'Entretenimiento', 'Ahorros', 'Otros'],
      datasets: [{
        data: [450, 600, 200, 300, 0],
        backgroundColor: [
          '#6366f1',
          '#ec4899',
          '#f59e0b',
          '#10b981',
          '#94a3b8'
        ],
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
          labels: {
            color: '#94a3b8',
            font: {
              family: 'Outfit',
              size: 12
            }
          }
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

// Modal Functions
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

  if (isExpense && scope === 'couple') {
    splitGroup.style.display = 'block';
  } else {
    splitGroup.style.display = 'none';
  }
}

function handleSaveTransaction(event) {
  event.preventDefault();

  const type = document.querySelector('input[name="type"]:checked').value;
  const description = document.getElementById('tx-description').value.trim();
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const category = document.getElementById('tx-category').value;
  const scope = document.getElementById('tx-scope').value;
  const split = document.getElementById('tx-split').value;

  if (!description || isNaN(amount) || amount <= 0) return;

  const newTx = {
    id: Date.now(),
    type,
    description,
    amount,
    category,
    scope,
    split: scope === 'couple' && type === 'expense' ? split : '100-0',
    date: new Date().toISOString().split('T')[0]
  };

  transactions.push(newTx);
  renderDashboardData();
  closeTransactionModal();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  renderDashboardData();
}

// Toggle Habit Completion
function toggleHabit(button) {
  button.classList.toggle('completed');
  if (button.classList.contains('completed')) {
    button.innerText = '✓';
  } else {
    button.innerText = '';
  }
}

// Add Habit Prompt
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

// Add Task Prompt
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

// Service Worker Registration for PWA
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker registrado con éxito:', reg.scope))
      .catch(err => console.log('Falló el registro del Service Worker:', err));
  }
}
