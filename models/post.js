const { sequelize, Sequelize } = require("./banco");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Modelo de Modalidade
const Modalidade = sequelize.define('modalidades', {
    modalidade: { type: Sequelize.STRING },
    descricao: { type: Sequelize.STRING },
    dias: { type: Sequelize.STRING },
    horario: { type: Sequelize.STRING },
    local: { type: Sequelize.STRING }
});

// Modelo de Evento
const Evento = sequelize.define('eventos', {
    evento: { type: Sequelize.STRING },
    descricao: { type: Sequelize.STRING },
    dias: { type: Sequelize.STRING },
    horario: { type: Sequelize.STRING },
    local: { type: Sequelize.STRING },
});

// Modelo de Loja
const Loja = sequelize.define('lojas', {
    loja: { type: Sequelize.STRING },
    descricao: { type: Sequelize.STRING },
    preco: { type: Sequelize.DECIMAL(10, 2) }
});

// Modelo de Inscrição
const Inscricao = sequelize.define('inscricoes', {
    inscricao: { type: Sequelize.STRING },
    cpf: { type: Sequelize.STRING },
    endereco: { type: Sequelize.STRING },
    bairro: { type: Sequelize.STRING },
    cep: { type: Sequelize.STRING },
    cidade: { type: Sequelize.STRING },
    estado: { type: Sequelize.STRING },
    celular: { type: Sequelize.STRING },
    email: { type: Sequelize.STRING },
    curso: { type: Sequelize.STRING },
    turno: { type: Sequelize.STRING },
    periodo: { type: Sequelize.INTEGER }
});

// Modelo de Contato
const Contato = sequelize.define('contatos', {
    contato: { type: Sequelize.STRING },
    email: { type: Sequelize.STRING },
    telefone: { type: Sequelize.STRING },
    mensagem: { type: Sequelize.TEXT }
});

// Modelo de Usuario
const Usuario = sequelize.define('usuarios', {
    username: { type: Sequelize.STRING, unique: true, allowNull: false },
    senha: { type: Sequelize.STRING, allowNull: false }
});

// Sincronizar com o banco de dados
sequelize.sync({ alter: false })
    .then(() => console.log("Tabelas sincronizadas com sucesso!"))
    .catch((erro) => console.log("Erro ao sincronizar tabelas: ", erro));

module.exports = {
    Modalidade,
    Inscricao,
    Contato,
    Loja,
    Evento,
    Usuario
};
