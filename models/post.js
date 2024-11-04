const db = require("./banco");

// Modalidades
const Modalidade = db.sequelize.define('modalidades', {
    modalidade: {
        type: db.Sequelize.STRING
    },
    descricao: {
        type: db.Sequelize.STRING
    },
    dias: {
        type: db.Sequelize.STRING
    },
    horario: {
        type: db.Sequelize.STRING
    },
    local: {
        type: db.Sequelize.STRING
    }
});

//Inscrições
const Inscricao = db.sequelize.define('inscricoes', {
    nome: {
        type: db.Sequelize.STRING
    },
    cpf: {
        type: db.Sequelize.STRING
    },
    endereco: {
        type: db.Sequelize.STRING
    },
    bairro: {
        type: db.Sequelize.STRING
    },
    cep: {
        type: db.Sequelize.INTEGER
    },
    cidade: {
        type: db.Sequelize.STRING
    },
    estado: {
        type: db.Sequelize.STRING
    },
    celular: {
        type: db.Sequelize.STRING
    },
    email: {
        type: db.Sequelize.STRING
    },
    curso: {
        type: db.Sequelize.STRING
    },
    turno: {
        type: db.Sequelize.STRING
    },
    periodo: {
        type: db.Sequelize.INTEGER
    }
});

//Contatos
const Contato = db.sequelize.define('contatos', {
    nome: {
        type: db.Sequelize.STRING
    },
    email: {
        type: db.Sequelize.STRING
    },
    telefone: {
        type: db.Sequelize.STRING
    },
    mensagem: {
        type: db.Sequelize.TEXT
    }
});

//Loja
const Loja = db.sequelize.define('lojas', {
    imagemUrl: {
        type: db.Sequelize.STRING
    },
    nome: {
        type: db.Sequelize.STRING
    },
    descricao: {
        type: db.Sequelize.STRING
    },
    preco: {
        type: db.Sequelize.DECIMAL(10, 2)
    }
});

// Eventos
const Evento = db.sequelize.define('eventos', {
    imagemUrl: {
        type: db.Sequelize.STRING
    },
    nome: {
        type: db.Sequelize.STRING
    },
    data: {
        type: db.Sequelize.DATE
    },
    horario: {
        type: db.Sequelize.STRING
    },
    local: {
        type: db.Sequelize.STRING
    },
    descricao: {
        type: db.Sequelize.STRING
    }
});

// Sincroniza os modelos com o banco de dados
db.sequelize.sync({ force: true })  // `force: true` recria as tabelas a cada execução
    .then(() => {
        console.log("Tabelas criadas com sucesso!");
    })
    .catch((erro) => {
        console.log("Erro ao criar tabelas: ", erro);
    });

// Exporta todos os modelos
module.exports = {
    Modalidade,
    Inscricao,
    Contato,
    Loja,
    Evento,
};
