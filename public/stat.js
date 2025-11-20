// public/years.js

let yearsChart = null;
const PRODUCTS = ["Politik 225", "MVP Foot", "Radio MVP Foot"];

document.addEventListener('DOMContentLoaded', () => {
  loadAnnualData();
});

async function loadAnnualData() {
  try {
    const res = await fetch('/api/revenues');
    if (!res.ok) throw new Error('Erreur chargement revenus');
    const revenues = await res.json();

    const aggregated = aggregateByYear(revenues);
    renderYearsTable(aggregated);
    renderYearsChart(aggregated);
  } catch (err) {
    console.error(err);
  }
}

/**
 * Agrège les revenus par année et par produit
 * Retourne un objet :
 * {
 *   2023: { year: 2023, "Politik 225": 1000, "MVP Foot": 800, "Radio MVP Foot": 300, total: 2100 },
 *   2024: { ... },
 *   ...
 * }
 */
function aggregateByYear(revenues) {
  const map = {};

  revenues.forEach(r => {
    const d = new Date(r.date);
    const y = d.getFullYear();

    if (!map[y]) {
      map[y] = {
        year: y,
        "Politik 225": 0,
        "MVP Foot": 0,
        "Radio MVP Foot": 0,
        total: 0
      };
    }

    if (map[y][r.product] != null) {
      map[y][r.product] += r.amount;
    }
    map[y].total += r.amount;
  });

  return map;
}

function renderYearsTable(aggregated) {
  const tbody = document.querySelector('#years-table tbody');
  tbody.innerHTML = '';

  const rows = Object.values(aggregated).sort((a, b) => a.year - b.year);

  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.year}</td>
      <td>${row["Politik 225"].toFixed(2)}</td>
      <td>${row["MVP Foot"].toFixed(2)}</td>
      <td>${row["Radio MVP Foot"].toFixed(2)}</td>
      <td><strong>${row.total.toFixed(2)}</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderYearsChart(aggregated) {
  const ctx = document.getElementById('yearsChart').getContext('2d');

  const rows = Object.values(aggregated).sort((a, b) => a.year - b.year);
  const labels = rows.map(r => r.year);

  const dataPolitik = rows.map(r => r["Politik 225"].toFixed(2));
  const dataMvpFoot = rows.map(r => r["MVP Foot"].toFixed(2));
  const dataRadio = rows.map(r => r["Radio MVP Foot"].toFixed(2));
  const dataTotal = rows.map(r => r.total.toFixed(2));

  if (yearsChart) {
    yearsChart.destroy();
  }

  yearsChart = new Chart(ctx, {
    type: 'line', // tu peux mettre 'bar' si tu préfères des barres
    data: {
      labels,
      datasets: [
        {
          label: 'Politik 225',
          data: dataPolitik,
          fill: false
        },
        {
          label: 'MVP Foot',
          data: dataMvpFoot,
          fill: false
        },
        {
          label: 'Radio MVP Foot',
          data: dataRadio,
          fill: false
        },
        {
          label: 'Total 3 produits',
          data: dataTotal,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Revenus annuels ($)' }
        },
        x: {
          title: { display: true, text: 'Années' }
        }
      }
    }
  });
}
