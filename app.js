/* ==========================================================================
   Shared Life Hub - Application Logic
   Handles: Data state, View switching, Chart rendering & Service Worker setup
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initChart();
  registerServiceWorker();
});

// View Switcher (All / Personal / Couple)
function switchView(viewMode) {
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
}

// Chart.js Expenses Initialization
let expensesChartInstance = null;

function initChart() {
  const ctx = document.getElementById('expensesChart').getContext('2d');
  
  expensesChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Hogar & Servicios', 'Mercado', 'Entretenimiento', 'Ahorros'],
      datasets: [{
        data: [450, 600, 200, 300],
        backgroundColor: [
          '#6366f1',
          '#ec4899',
          '#f59e0b',
          '#10b981'
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

// Toggle Habit Completion
function toggleHabit(button) {
  button.classList.toggle('completed');
  if (button.classList.contains('completed')) {
    button.innerText = '✓';
  } else {
    button.innerText = '';
  }
}

// Transaction Modal Placeholder
function openTransactionModal() {
  alert('✨ PRÓXIMAMENTE: Modal interactivo para agregar ingresos/gastos con división porcentual (ej. 60/40)!');
}

// Add Habit Prompt Placeholder
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

// Add Task Prompt Placeholder
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
