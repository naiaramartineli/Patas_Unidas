const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// servir imagens
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// rotas unificadas
const rotas = require('./routes/indexRoutes');
app.use('/api', rotas);

// porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
