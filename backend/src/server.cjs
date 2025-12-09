require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const morgan = require("morgan");

// 🔥 IMPORTAR TODAS AS ROTAS CRIADAS (CAMINHOS CORRIGIDOS)
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const caoRoutes = require("./routes/caoRoutes");
const racaRoutes = require("./routes/racaRoutes");
const vacinaRoutes = require("./routes/vacinaRoutes");
const adotaRoutes = require("./routes/adotaRoutes");
const enderecoRoutes = require("./routes/enderecoRoutes");
const recuperaSenhaRoutes = require("./routes/recuperaSenhaRoutes");

const app = express();

// Middlewares de segurança e logging
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Criar diretórios de uploads se não existirem
// __dirname agora é a pasta 'src'
const uploadsDirs = [
    path.join(__dirname, "public/uploads"),
    path.join(__dirname, "public/uploads/caes"),
    path.join(__dirname, "public/uploads/usuarios"),
    path.join(__dirname, "../uploads") // Para compatibilidade - cria na raiz do projeto
];

uploadsDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Diretório criado: ${dir}`);
    }
});

// Servir arquivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); // Para compatibilidade

/* ================================
   🚀 ROTAS DA APLICAÇÃO
================================ */

// AUTH - Autenticação e registro
app.use("/api/auth", authRoutes);

// USERS - Gerenciamento de usuários
app.use("/api/usuarios", userRoutes);

// CÃES - Gerenciamento de cães
app.use("/api/caes", caoRoutes);

// RAÇAS - Gerenciamento de raças
app.use("/api/racas", racaRoutes);

// VACINAS - Gerenciamento de vacinas
app.use("/api/vacinas", vacinaRoutes);

// ADOÇÕES - Gerenciamento de adoções
app.use("/api/adocoes", adotaRoutes);

// ENDEREÇOS - Gerenciamento de endereços
app.use("/api/enderecos", enderecoRoutes);

// RECUPERAÇÃO DE SENHA
app.use("/api/recuperar-senha", recuperaSenhaRoutes);

/* ================================
   ROTA DE HEALTH CHECK
================================ */
app.get("/api/health", (req, res) => {
    res.json({
        mensagem: "API Patas Unidas 🐾",
        status: "online",
        timestamp: new Date().toISOString(),
        versao: process.env.npm_package_version || "1.0.0",
        ambiente: process.env.NODE_ENV || "development"
    });
});

/* ================================
   ROTA PRINCIPAL
================================ */
app.get("/", (req, res) => {
    res.json({
        mensagem: "API Patas Unidas 🐾",
        status: "online",
        documentacao: "/api/health",
        rotas: {
            auth: "/api/auth",
            usuarios: "/api/usuarios",
            caes: "/api/caes",
            racas: "/api/racas",
            vacinas: "/api/vacinas",
            adocoes: "/api/adocoes",
            enderecos: "/api/enderecos",
            recuperar_senha: "/api/recuperar-senha"
        }
    });
});

/* ================================
   404 - ROTA NÃO ENCONTRADA
================================ */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Rota não encontrada",
        code: "ROUTE_NOT_FOUND",
        rota: req.originalUrl,
        metodo: req.method,
        timestamp: new Date().toISOString()
    });
});

/* ================================
   MIDDLEWARE DE ERRO GLOBAL
================================ */
app.use((err, req, res, next) => {
    console.error("🔥 ERRO NO SERVIDOR:", err);
    
    // Definir status padrão
    const statusCode = err.status || err.statusCode || 500;
    
    // Resposta de erro
    const errorResponse = {
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : "Erro interno no servidor",
        code: err.code || "INTERNAL_SERVER_ERROR",
        timestamp: new Date().toISOString()
    };
    
    // Adicionar stack trace apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development' && err.stack) {
        errorResponse.stack = err.stack.split("\n");
    }
    
    res.status(statusCode).json(errorResponse);
});

/* ================================
   SERVIDOR LIGADO
================================ */
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
    console.log(`========================================`);
    console.log(`🟢 SERVIDOR PATAS UNIDAS RODANDO`);
    console.log(`========================================`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Uploads: ${path.join(__dirname, "public/uploads")}`);
    console.log(`========================================`);
    console.log(`📋 Rotas disponíveis:`);
    console.log(`   🔐 Autenticação: /api/auth`);
    console.log(`   👤 Usuários: /api/usuarios`);
    console.log(`   🐶 Cães: /api/caes`);
    console.log(`   🏷️  Raças: /api/racas`);
    console.log(`   💉 Vacinas: /api/vacinas`);
    console.log(`   🏠 Adoções: /api/adocoes`);
    console.log(`   📍 Endereços: /api/enderecos`);
    console.log(`   🔑 Recuperação: /api/recuperar-senha`);
    console.log(`========================================`);
});