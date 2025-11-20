// public/app.js

let chartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  loadSummary();
  loadTable();
  setupForm();
});


const now = new Date();
const currentKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

if (row.month === currentKey) tr.classList.add("highlight");
function setupForm() {
  const form = document.getElementById('revenue-form');
  const message = document.getElementById('form-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    message.textContent = '';

    const product = document.getElementById('product').value;
    const date = document.getElementById('date').value;
    const amount = document.getElementById('amount').value;

    try {
      const res = await fetch('https://datamvpgroup.onrender.com/api/revenues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, date, amount })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      message.style.color = '#22c55e';
      message.textContent = 'Revenu enregistré avec succès ✅';

      form.reset();
      // Recharger les données
      loadSummary();
      loadTable();
    } catch (err) {
      message.style.color = '#ef4444';
      message.textContent = err.message;
    }
  });
}

async function loadSummary() {
  try {
    const res = await fetch('https://datamvpgroup.onrender.com/api/summary');
    if (!res.ok) throw new Error('Erreur chargement summary');
    const data = await res.json();

    renderCards(data.summary);
    renderChart(data.summary, data.year);
  } catch (err) {
    console.error(err);
  }
}

async function loadTable() {
  try {
    const res = await fetch('https://datamvpgroup.onrender.com/api/revenues');
    if (!res.ok) throw new Error('Erreur chargement revenus');
    const revenues = await res.json();

    renderTable(revenues);
  } catch (err) {
    console.error(err);
  }
}

function renderCards(summary) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  Object.keys(summary).forEach(product => {
    const s = summary[product];

    const fluct = s.fluctuation.toFixed(1);
    const fluctClass = s.fluctuation >= 0 ? 'positive' : 'negative';
    const fluctText =
      s.previousMonthTotal === 0 && s.currentMonthTotal === 0
        ? 'Pas de données suffisantes'
        : `${fluct >= 0 ? '+' : ''}${fluct}% vs mois précédent`;

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${product}</h3>
      <small>Année ${new Date().getFullYear()}</small>

      <div class="card-values">
        <div>
          <span class="label">Mois en cours</span>
          <span class="value">${s.currentMonthTotal.toFixed(2)} $</span>
        </div>
        <div>
          <span class="label">Annuel</span>
          <span class="value">${s.annualTotal.toFixed(2)} $</span>
        </div>
        <div>
          <span class="label">Objectif mois prochain</span>
          <span class="value">${s.nextMonthGoal.toFixed(2)} $</span>
        </div>
      </div>

      <p class="fluctuation ${fluctClass}">
        ${fluctText}
      </p>
    `;

    container.appendChild(card);
  });
}

function renderTable(revenues) {
  const tbody = document.querySelector('#revenue-table tbody');
  tbody.innerHTML = '';

  const products = ["Politik 225", "MVP Foot", "Radio MVP Foot"];

  // Regrouper par mois + produit
  const map = {};
  revenues.forEach(r => {
    const d = new Date(r.date);
    const keyMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!map[keyMonth]) {
      map[keyMonth] = {
        month: keyMonth,
        "Politik 225": 0,
        "MVP Foot": 0,
        "Radio MVP Foot": 0,
        total: 0
      };
    }

    map[keyMonth][r.product] += r.amount;
    map[keyMonth].total += r.amount;
  });

  // Convertir Map en array trié
  const rows = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));

  // Afficher chaque ligne
  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.month}</td>
      <td>${row["Politik 225"].toFixed(2)}</td>
      <td>${row["MVP Foot"].toFixed(2)}</td>
      <td>${row["Radio MVP Foot"].toFixed(2)}</td>
      <td><strong>${row.total.toFixed(2)}</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

/*
function renderTable(revenues) {
  const tbody = document.querySelector('#revenue-table tbody');
  tbody.innerHTML = '';

  // Regrouper par mois + produit
  const map = {};
  revenues.forEach(r => {
    const d = new Date(r.date);
    const keyMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const key = `${keyMonth}__${r.product}`;

    if (!map[key]) {
      map[key] = {
        month: keyMonth,
        product: r.product,
        total: 0
      };
    }
    map[key].total += r.amount;
  });

  /*const rows = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));

  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.month}</td>
      <td>${row.product}</td>
      <td>${row.total.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  }); 

  const rows = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));

  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.month}</td>
      <td>${row.product[0]}</td>
           <td>${row.product[1]}</td>
                <td>${row.product[2]}</td>
      <td>${row.total.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });


}*/

function renderChart(summary, year) {
  const ctx = document.getElementById('revenueChart').getContext('2d');

  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  );

  const products = Object.keys(summary);

  const datasets = products.map((product, idx) => {
    const s = summary[product];
    const data = months.map(m => (s.monthlyTotals[m] || 0).toFixed(2));

    // Pas de couleurs forcées, Chart.js gère par défaut si on laisse vide,
    // mais on doit fournir une structure correcte.
    return {
      label: product,
      data,
      fill: false
    };
  });

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Revenus ($)' }
        },
        x: {
          title: { display: true, text: 'Mois' }
        }
      }
    }
  });
}
