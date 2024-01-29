const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use(cors({
  origin: 'http://localhost:8080' // Permitir apenas solicitações deste domínio
}));

// Estado da aplicação (simulação de um banco de dados simples)
let accounts = {};

// Rota para redefinir o estado (reset)
app.post('/reset', (req, res) => {
  accounts = {};
  res.sendStatus(200);
});

// Rota para obter o saldo de uma conta
app.get('/balance', (req, res) => {
  const accountId = req.query.account_id;

  if (accounts[accountId] === undefined) {
    res.status(404).json(0);
  } else {
    res.status(200).json(accounts[accountId].balance);
  }
});

// Rota para depósitos, saques e transferências entre contas
app.post('/event', (req, res) => {
  const event = req.body;

  if (event.type === 'deposit') {
    const accountId = event.destination;
    const amount = event.amount;

    if (accounts[accountId] === undefined) {
      accounts[accountId] = { id: accountId, balance: amount };
    } else {
      accounts[accountId].balance += amount;
    }

    res.status(201).json({ destination: accounts[accountId] });
  } else if (event.type === 'withdraw') {
    const accountId = event.origin;
    const amount = event.amount;

    if (accounts[accountId] === undefined) {
      res.status(404).json(0);
    } else {
      if (accounts[accountId].balance >= amount) {
        accounts[accountId].balance -= amount;
        res.status(201).json({ origin: accounts[accountId] });
      } else {
        res.status(400).json({ balance: accounts[accountId].balance, error: 'Insufficient funds for withdrawal' });
      }
    }
  } else if (event.type === 'transfer') {
    const originAccountId = event.origin;
    const destinationAccountId = event.destination;
    const amount = event.amount;

    if (accounts[originAccountId] === undefined) {
      res.status(404).json(0);
    } else {
      if (accounts[originAccountId].balance >= amount) {
        accounts[originAccountId].balance -= amount;

        if (accounts[destinationAccountId] === undefined) {
          accounts[destinationAccountId] = { id: destinationAccountId, balance: amount };
        } else {
          accounts[destinationAccountId].balance += amount;
        }

        res.status(201).json({
          origin: accounts[originAccountId],
          destination: accounts[destinationAccountId]
        });
      } else {
        res.status(400).json({ origin: accounts[originAccountId], destination: null, error: 'Insufficient funds for transfer' });
      }
    }
  } else {
    res.status(400).json({ error: 'Invalid event type' });
  }
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

