const express = require("express");
const app = express();
const handlebars = require("express-handlebars").engine;
const bodyParser = require("body-parser");
const { Modalidade, Inscricao, Contato, Loja, Evento, Usuario } = require("./models/post");
const bcrypt = require("bcrypt");


// Configuração para servir arquivos estáticos
app.use(express.static("public"));

// Configuração do handlebars com permissões para propriedades herdadas
app.engine("handlebars", handlebars({
    defaultLayout: "main",
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));
app.set("view engine", "handlebars");

// Configuração do body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware para definir variáveis comuns
app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    next();
});


// Função auxiliar para buscar dados e renderizar views
const renderData = (model, res, viewName, variableName = 'data') => {
    model.findAll()
        .then((data) => {
            const context = {};
            context[variableName] = data;
            res.render(viewName, context);
        })
        .catch((erro) => {
            res.send(`Erro ao carregar ${viewName}: ` + erro);
        });
};


// ---> Login <---

// Adicionando dados de sessão para armazenar o estado do login
const session = require("express-session");
app.use(session({
    secret: "secret-key",  //(no arquivo privado está a minha chave, aqui deixei um exemplo)
    resave: false,
    saveUninitialized: true,
}));

require('dotenv').config();

//app.use(session({
   // secret: process.env.SESSION_SECRET,
    //resave: false,
   // saveUninitialized: true,
//}));


// Rota de autenticação (POST) para login
app.post("/login", async (req, res) => {
    const { username, senha } = req.body;

    try {
        // Buscar o usuário no banco de dados        
        const usuario = await Usuario.findOne({ where: { username } });

        if (!usuario) {
            return res.send("Usuário não encontrado.");
        }

        // Comparando a senha fornecida com a armazenada (hash)
        const match = await bcrypt.compare(senha, usuario.senha);

        if (match) {
            req.session.loggedIn = true;  // Guardando o estado da sessão
            res.redirect("/gestao");  // Redirecionando para a página de gestão
        } else {
            res.send("Credenciais inválidas.");
        }
    } catch (erro) {
        res.status(500).send("Erro ao tentar fazer login: " + erro);
    }
});

// Rota para exibir a página de login (GET)
app.get("/login", (req, res) => {
    res.render("login");  // Renderiza o arquivo login.handlebars
});


// Função para verificar se o usuário está autenticado antes de acessar a página de gestão
const verificarLogin = (req, res, next) => {
    if (!req.session.loggedIn) {
        return res.redirect("/login");  // Se não estiver autenticado, redireciona para o login
    }
    next();  // Caso contrário, continua para a rota de gestão
};



// Página de gestão com proteção de login
app.get("/gestao", verificarLogin, (req, res) => {
    res.render("gestao", {
        pages: [
            { name: "Modalidades", path: "/consultarModalidade" },
            { name: "Cadastrar Modalidade", path: "/cadastrarModalidade" },
            { name: "Inscrições", path: "/consultarInscricao" },
            { name: "Contatos", path: "/consultarContato" },
            { name: "Loja", path: "/consultarLoja" },
            { name: "Cadastrar Produto", path: "/cadastrarLoja" },
            { name: "Eventos", path: "/consultarEvento" },
            { name: "Cadastrar Evento", path: "/cadastrarEvento" }
        ]
    });
});

// Logout - Para deslogar o usuário
app.get("/logout", (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            return res.send("Erro ao fazer logout.");
        }
        res.redirect("/login");  // Redireciona para a página de login após o logout
    });
});

app.post("/registrar", async (req, res) => {
    const { username, senha } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);  // Gerando um salt
        const hashedSenha = await bcrypt.hash(senha, salt);  // Criando o hash da senha

        // Salva o usuário com o nome de usuário e a senha hash
        await Usuario.create({ username, senha: hashedSenha });

        res.redirect("/login");  // Redireciona para a página de login após o registro
    } catch (erro) {
        res.send("Erro ao registrar usuário: " + erro);
    }
});


// ---> HOME <---

// Rota principal (home) - Exibe modalidades e link para inscrição
app.get("/", (req, res) => {
    Modalidade.findAll()
        .then((modalidades) => {
            res.render("home", { modalidades });
        })
        .catch((erro) => {
            res.send("Erro ao carregar modalidades: " + erro);
        });
}); 

// Rota para inscrição - alunos que desejam se tornar membros da atlética
app.get("/inscricao", (req, res) => res.render("inscricao"));

// Rota para cadastrar uma nova inscrição
app.post("/cadastrarInscricao", (req, res) => {
    Inscricao.create(req.body)
        .then(() => res.redirect("/"))
        .catch((erro) => res.send("Erro ao cadastrar inscrição: " + erro));
});

// Rota para contato - alunos e demais interessados
app.get("/contato", (req, res) => res.render("contato"));

// Rota para cadastrar uma nova mensagem de contato com a atlética
app.post("/cadastrarContato", (req, res) => {
    Contato.create(req.body)
        .then(() => res.redirect("/"))
        .catch((erro) => res.send("Erro ao cadastrar contato: " + erro));
});

// Rotas de exibição para Evento - alunos e demais interessados
app.get("/evento", (req, res) => {
    Evento.findAll() 
        .then(eventos => {
            res.render("evento", { eventos });  // Renderizando para o template evento.handlebars
        })
        .catch((erro) => {
            res.send("Erro ao buscar eventos: " + erro);
        });
});

// Rotas de exibição para Loja - alunos e demais interessados
app.get("/loja", (req, res) => {
    renderData(Loja, res, "loja");
});


// ---> Gestão <--- (Página de gestão do site com links para os CRUDs)

// -> Modalidade
// Rota para consultar uma nova modalidade
app.get("/consultarModalidade", (req, res) => {
    renderData(Modalidade, res, "consultarModalidade", "modalidades");
});

// Rota para cadastrar uma nova modalidade
app.get("/cadastrarModalidade", (req, res) => {
    res.render("cadastrarModalidade");
});

app.post("/cadastrarModalidade", (req, res) => {
    Modalidade.create(req.body)
        .then(() => {
            console.log("Modalidade cadastrada com sucesso:", req.body);
            res.redirect("/consultarModalidade");
        })
        .catch((erro) => res.send("Erro ao cadastrar modalidade: " + erro));
});

// Rota para editar uma modalidade
app.get("/editarModalidade/:id", (req, res) => {
    Modalidade.findByPk(req.params.id)
        .then((modalidade) => {
            if (modalidade) {
                res.render("editarModalidade", { modalidade });
            } else {
                res.send("Modalidade não encontrada.");
            }
        })
        .catch((erro) => res.send("Erro ao buscar modalidade: " + erro) );
});

// Rota para atualizar uma modalidade
app.post("/atualizarModalidade/:id", (req, res) => {
    Modalidade.update(req.body, { where: { id: req.params.id } })
        .then(() => res.redirect("/consultarModalidade"))
        .catch((erro) => res.send("Erro ao atualizar modalidade: " + erro));
});


// Rota para deletar uma modalidade
app.post("/deletarModalidade/:id", (req, res) => {
    Modalidade.destroy({ where: { id: req.params.id } })
        .then(() => res.redirect("/consultarModalidade"))
        .catch((erro) => res.send("Erro ao deletar modalidade: " + erro));
});



// -> Inscrição - Listagem de inscrições de alunos que desejam se tornar membros da atlética
// Rota para consultar as inscrições
app.get("/consultarInscricao", (req, res) => {
    renderData(Inscricao, res, "consultarInscricao", "inscricoes");
});

// -> Contato - Mensagens de alunos e demais interessados
app.get("/consultarContato", (req, res) => {
    renderData(Contato, res, "consultarContato", "contatos");
});

// -> Loja 
// Rota para consultar os produtos da loja
app.get("/consultarLoja", (req, res) => {
    renderData(Loja, res, "consultarLoja", "produtos");
});

// Rota para cadastrar um novo produto na loja
app.get("/cadastrarLoja", (req, res) => {
    res.render("cadastrarLoja");
});

// Rota para cadastrar um novo produto na loja
app.post("/cadastrarLoja", (req, res) => {
    Loja.create(req.body)
        .then(() => res.redirect("/consultarLoja"))
        .catch((erro) => res.send("Erro ao cadastrar produto na loja: " + erro));
});

// -> Eventos e Campeonatos
// Rota para consultar os eventos
app.get("/consultarEvento", (req, res) => {
    renderData(Evento, res, "consultarEvento", "eventos");
});

// Rota para cadastrar um novo eveno
app.get("/cadastrarEvento", (req, res) => {
    res.render("cadastrarEvento");
});

app.post("/cadastrarEvento", (req, res) => {
    Evento.create(req.body)
        .then(() => {
            console.log("Evento cadastrado com sucesso:", req.body);
        res.redirect("/consultarEvento");
        })
        .catch((erro) => res.send("Erro ao cadastrar evento: " + erro));
});

// Rota para editar um evento
app.get("/editarEvento/:id", (req, res) => {
    Evento.findByPk(req.params.id)
        .then((evento) => {
            if (evento) {
                res.render("editarEvento", { evento });
            } else {
                res.send("Evento não encontrado.");
            }
        })
        .catch((erro) => res.send("Erro ao buscar evento: " + erro));
});

// Rota para atualizar um evento
app.post("/atualizarEvento/:id", (req, res) => {
    Evento.update(req.body, { where: { id: req.params.id } })
        .then(() => res.redirect("/consultarEvento"))
        .catch((erro) => res.send("Erro ao atualizar evento: " + erro));
});

// Rota para deletar um evento
app.post("/deletarEvento/:id", (req, res) => {
    Evento.destroy({ where: { id: req.params.id } })
        .then(() => res.redirect("/consultarEvento"))
        .catch((erro) => res.send("Erro ao deletar evento: " + erro));
});

// Inicialização do servidor
app.listen(8081, () => console.log("Servidor ativo na porta 8081!"));
