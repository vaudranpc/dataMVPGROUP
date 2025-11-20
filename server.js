// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Revenue = require('./models/Revenue');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connexion MongoDB
const MONGO_URI = 'mongodb+srv://vaudranxgroup_db_user:jyOqziCKZJJ6oxpY@mvpfoot.87dxzzn.mongodb.net/?appName=mvpfoot';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur MongoDB :', err.message));

// ====== ROUTES API ======

// 1) Récupérer toutes les entrées de revenus
app.get('/api/revenues', async (req, res) => {
  try {
    const revenues = await Revenue.find().sort({ date: 1 });
    res.json(revenues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 2) Ajouter une nouvelle entrée de revenu
app.post('/api/revenues', async (req, res) => {
  try {
    const { product, date, amount ,password } = req.body;

    if (!product || !date || amount == null || !password) {
      return res.status(400).json({ error: 'Champs manquants' });
    }
    
    if (password !== '1234535') {
      console.log('Tentative avec mauvais mot de passe :', password);
      return res.status(401).json({ error: 'Mot de passe incorrect ❌' });
      // ⚠️ LE "return" EST OBLIGATOIRE ICI
    }

    const revenue = new Revenue({
      product,
      date: new Date(date),
      amount: Number(amount)
    });

    const saved = await revenue.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });

    

  }
});

// 3) Endpoint résumé (optionnel mais pratique)
//    Retourne les stats pré-calculées : mensualité, annuel, objectifs
app.get('/api/summary', async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    const startYear = new Date(currentYear, 0, 1);
    const endYear = new Date(currentYear + 1, 0, 1);

    const revenues = await Revenue.find({
      date: { $gte: startYear, $lt: endYear }
    }).sort({ date: 1 });

    const products = ['Politik 225', 'MVP Foot', 'Radio MVP Foot'];

    const summary = {};
    products.forEach(p => {
      summary[p] = {
        annualTotal: 0,
        monthlyTotals: {},      // "YYYY-MM" => total
        currentMonthTotal: 0,
        previousMonthTotal: 0,
        nextMonthGoal: 0,
        fluctuation: 0 // en %
      };
    });

    for (const rev of revenues) {
      const p = rev.product;
      const d = rev.date;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      summary[p].annualTotal += rev.amount;

      if (!summary[p].monthlyTotals[key]) {
        summary[p].monthlyTotals[key] = 0;
      }
      summary[p].monthlyTotals[key] += rev.amount;
    }

    products.forEach(p => {
      const curKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const prevKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      const cur = summary[p].monthlyTotals[curKey] || 0;
      const prev = summary[p].monthlyTotals[prevKey] || 0;

      summary[p].currentMonthTotal = cur;
      summary[p].previousMonthTotal = prev;
      summary[p].nextMonthGoal = cur + 20;

      if (prev > 0) {
        summary[p].fluctuation = ((cur - prev) / prev) * 100;
      } else if (cur > 0) {
        summary[p].fluctuation = 100; // croissance depuis 0
      } else {
        summary[p].fluctuation = 0;
      }
    });

    res.json({
      year: currentYear,
      summary
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
