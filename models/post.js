const { sequelize, Sequelize } = require("./banco");
const bcrypt = require("bcrypt");

// Modelo de Modalidade
const Modalidade = sequelize.define('modalidades', {
    modalidade: { type: Sequelize.STRING, allowNull: false },
    descricao: { type: Sequelize.STRING },
    dias: { type: Sequelize.STRING },
    horario: { type: Sequelize.STRING },
    local: { type: Sequelize.STRING }
});

// Modelo de Evento
const Evento = sequelize.define('eventos', {
    evento: { type: Sequelize.STRING, allowNull: false },
    descricao: { type: Sequelize.STRING },
    dias: { type: Sequelize.STRING },
    horario: { type: Sequelize.STRING },
    local: { type: Sequelize.STRING },
});

// Modelo de Loja
const Loja = sequelize.define('lojas', {
    loja: { type: Sequelize.STRING, allowNull: false },
    descricao: { type: Sequelize.STRING },
    preco: { type: Sequelize.DECIMAL(10, 2) }
});

// Modelo de Inscrição
const Inscricao = sequelize.define('inscricoes', {
    inscricao: { type: Sequelize.STRING, allowNull: false },
    cpf: { type: Sequelize.STRING, allowNull: false },
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

    
// Função genérica para buscar dados
const getAll = async (model) => {
    try {
        return await model.findAll();
    } catch (error) {
        console.error(`Erro ao buscar ${model.name}s:`, error);
        throw error;
    }
};

// Funções específicas de busca
const getModalidades = () => getAll(Modalidade);
const getEventos = () => getAll(Evento);
const getLojas = () => getAll(Loja);

module.exports = {
    Modalidade,
    Evento,
    Loja,
    Inscricao,
    Contato,
    Usuario,
    getModalidades,
    getEventos,
    getLojas
};
