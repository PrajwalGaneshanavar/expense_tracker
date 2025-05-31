const express = require('express');
const app = express();
app.use(express.json());

// Middleware to validate JWT (same as expenses service)
const validateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  fetch('http://auth-service/verify', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      req.userId = data.userId;
      next();
    })
    .catch(err => res.status(401).json({ error: err.message }));
};

// Get monthly summary
app.get('/reports/monthly', validateToken, async (req, res) => {
  try {
    const expensesRes = await fetch(`http://expenses-service/expenses`, {
      headers: { 'Authorization': req.headers.authorization }
    });
    const expenses = await expensesRes.json();
    
    const monthlySummary = expenses.reduce((acc, expense) => {
      const month = expense.date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + expense.amount;
      return acc;
    }, {});
    
    res.json(monthlySummary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get category breakdown
app.get('/reports/categories', validateToken, async (req, res) => {
  try {
    const expensesRes = await fetch(`http://expenses-service/expenses`, {
      headers: { 'Authorization': req.headers.authorization }
    });
    const expenses = await expensesRes.json();
    
    const categorySummary = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    
    res.json(categorySummary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3002, () => console.log('Reports service running on port 3002'));
