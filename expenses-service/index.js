const express = require('express');
const app = express();
app.use(express.json());

let expenses = [
  { id: 1, userId: 1, amount: 100, category: 'Food', date: '2023-10-01' },
  { id: 2, userId: 1, amount: 200, category: 'Transport', date: '2023-10-02' }
];

// Middleware to validate JWT
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

// CRUD Endpoints
app.get('/expenses', validateToken, (req, res) => {
  res.json(expenses.filter(e => e.userId == req.userId));
});

app.post('/expenses', validateToken, (req, res) => {
  const expense = {
    id: expenses.length + 1,
    userId: req.userId,
    amount: req.body.amount,
    category: req.body.category,
    date: req.body.date || new Date().toISOString().split('T')[0]
  };
  expenses.push(expense);
  res.status(201).json(expense);
});

app.delete('/expenses/:id', validateToken, (req, res) => {
  const index = expenses.findIndex(e => e.id == req.params.id && e.userId == req.userId);
  if (index === -1) return res.status(404).json({ error: 'Expense not found' });
  expenses.splice(index, 1);
  res.status(204).end();
});

app.listen(3001, () => console.log('Expenses service running on port 3001'));
