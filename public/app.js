// public/app.js

let chartProducts = null;
let chartTotal = null;


document.addEventListener('DOMContentLoaded', () => {
  loadSummary();
  loadTable();
  setupForm();
  setupGraphEnlarge(); // 👈 ajouter ça
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
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('https://datamvpgroup.onrender.com/api/revenues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, date, amount, password }) // 👈 mot de passe bien envoyé
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

      document.getElementById('password').value = "";
    }
  });
}

async function loadSummary() {
  try {
    const res = await fetch('https://datamvpgroup.onrender.com/api/summary');
    if (!res.ok) throw new Error('Erreur chargement summary');
    const data = await res.json();

   /* renderCards(data.summary);
    renderChart(data.summary, data.year);*/

    renderCards(data.summary);
    renderProductChart(data.summary, data.year); // graphe par produit
    renderTotalChart(data.summary, data.year);   // nouveau graphe total


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

  const currentYear = new Date().getFullYear();
  const products = ["Politik 225", "MVP Foot", "Radio MVP Foot"];

  // Filtrer uniquement l'année actuelle
  const filtered = revenues.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === currentYear;
  });

  // Regrouper par mois + produit
  const map = {};
  filtered.forEach(r => {
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

  const rows = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));

  rows.forEach(row => {
    const tr = document.createElement('tr');

    // Mettre en surbrillance la ligne du mois actuel
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    if (row.month === currentKey) {
      tr.classList.add("highlight");
    }

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

function renderProductChart(summary, year) {
  const ctx = document.getElementById('revenueChart').getContext('2d');

  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  );

  const products = Object.keys(summary);

  const datasets = products.map(product => {
    const s = summary[product];
    const data = months.map(m => (s.monthlyTotals[m] || 0).toFixed(2));

    return {
      label: product,
      data,
      fill: false
    };
  });

  if (chartProducts) {
    chartProducts.destroy();
  }

  chartProducts = new Chart(ctx, {
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



function renderTotalChart(summary, year) {
  const ctx = document.getElementById('totalRevenueChart').getContext('2d');

  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  );

  const products = Object.keys(summary);

  // Calcul du total mensuel (somme des 3 produits)
  const totalData = months.map(m => {
    let sum = 0;
    products.forEach(p => {
      const s = summary[p];
      sum += s.monthlyTotals[m] || 0;
    });
    return sum.toFixed(2);
  });

  if (chartTotal) {
    chartTotal.destroy();
  }

 chartTotal = new Chart(ctx, {
  type: 'bar', // 🔥 maintenant en barres
  data: {
    labels: months,
    datasets: [
      {
        label: 'Total 3 produits',
        data: totalData,
        fill: false
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Revenus totaux ($)' }
      },
      x: {
        title: { display: true, text: 'Mois' }
      }
    },
    barPercentage: 0.6,
    categoryPercentage: 0.6
  }
});
}


function setupGraphEnlarge() {
  const panels = document.querySelectorAll('.panel-graph');
  const backdrop = document.getElementById('graph-backdrop');

  if (!backdrop) return;

  function closeAll() {
    panels.forEach(p => p.classList.remove('enlarged'));
    backdrop.classList.remove('active');
  }

  panels.forEach(panel => {
    panel.addEventListener('click', () => {
      const isEnlarged = panel.classList.contains('enlarged');
      if (!isEnlarged) {
        // Agrandir ce panel
        closeAll();
        panel.classList.add('enlarged');
        backdrop.classList.add('active');
      } else {
        // Réduire si déjà agrandi
        closeAll();
      }
    });
  });

  // Clic sur le fond pour fermer
  backdrop.addEventListener('click', closeAll);

  // Touche Escape pour fermer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAll();
    }
  });
}
