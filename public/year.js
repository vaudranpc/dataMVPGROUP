// public/year.js

let allRevenues = [];
const PRODUCTS = ["Politik 225", "MVP Foot", "Radio MVP Foot"];

document.addEventListener('DOMContentLoaded', () => {
  loadRevenues();
});

async function loadRevenues() {
  try {
    const res = await fetch('/api/revenues');
    if (!res.ok) throw new Error('Erreur chargement revenus');
    allRevenues = await res.json();

    initYearSelect();
  } catch (err) {
    console.error(err);
    document.getElementById('year-info').textContent =
      "Erreur lors du chargement des données.";
  }
}

function initYearSelect() {
  const yearSelect = document.getElementById('year-select');

  // Récupérer les années distinctes
  const years = new Set();
  allRevenues.forEach(r => {
    const d = new Date(r.date);
    years.add(d.getFullYear());
  });

  const sortedYears = Array.from(years).sort((a, b) => b - a); // plus récente en premier

  // Si aucune donnée, on arrête
  if (sortedYears.length === 0) {
    yearSelect.innerHTML = '<option>Aucune donnée</option>';
    return;
  }

  yearSelect.innerHTML = '';
  sortedYears.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  });

  // Par défaut, on prend la première (année la plus récente)
  const defaultYear = sortedYears[0];
  yearSelect.value = defaultYear;

  yearSelect.addEventListener('change', () => {
    const y = parseInt(yearSelect.value, 10);
    renderYearView(y);
  });

  // Premier rendu
  renderYearView(defaultYear);
}

function renderYearView(year) {
  const yearInfo = document.getElementById('year-info');
  yearInfo.textContent = `Données affichées pour l'année ${year}`;

  const filtered = allRevenues.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year;
  });

  renderYearSummary(filtered);
  renderYearMonthly(filtered, year);
  renderYearRaw(filtered);
}

/**
 * Résumé annuel par produit
 */
function renderYearSummary(revenues) {
  const tbody = document.querySelector('#year-summary-table tbody');
  tbody.innerHTML = '';

  const totals = {
    "Politik 225": 0,
    "MVP Foot": 0,
    "Radio MVP Foot": 0
  };

  revenues.forEach(r => {
    if (totals[r.product] != null) {
      totals[r.product] += r.amount;
    }
  });

  PRODUCTS.forEach(prod => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${prod}</td>
      <td>${totals[prod].toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Tableau mensuel pivoté (mois en lignes, produits en colonnes)
 */
function renderYearMonthly(revenues, year) {
  const tbody = document.querySelector('#year-monthly-table tbody');
  tbody.innerHTML = '';

  const map = {};

  revenues.forEach(r => {
    const d = new Date(r.date);
    const keyMonth = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!map[keyMonth]) {
      map[keyMonth] = {
        month: keyMonth,
        "Politik 225": 0,
        "MVP Foot": 0,
        "Radio MVP Foot": 0,
        total: 0
      };
    }

    if (map[keyMonth][r.product] != null) {
      map[keyMonth][r.product] += r.amount;
    }
    map[keyMonth].total += r.amount;
  });

  const rows = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;

  rows.forEach(row => {
    const tr = document.createElement('tr');

    // Highlight mois en cours si on est sur l'année actuelle
    if (row.month === currentKey) {
      tr.classList.add('highlight');
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

/**
 * Tableau brut des entrées (chaque revenu)
 */
function renderYearRaw(revenues) {
  const tbody = document.querySelector('#year-raw-table tbody');
  tbody.innerHTML = '';

  const sorted = revenues.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach(r => {
    const d = new Date(r.date);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${dateStr}</td>
      <td>${r.product}</td>
      <td>${r.amount.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}
