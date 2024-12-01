const express = require("express");
const app = express();
const handlebars = require("express-handlebars").engine;
const bcrypt = require("bcrypt");
const fs = require("fs-extra");
const path = require("path");
require("dotenv").config();
const bodyParser = require("body-parser");

const { Modalidade, Inscricao, Contato, Loja, Evento, Usuario } = require("./models/post");
const { NlpManager } = require("node-nlp");

const modelPath = path.join(__dirname, "model");
const modelFilePath = path.join(modelPath, "modeloTreinado.json");

// Garantir que o diretório "model" exista
fs.ensureDirSync(modelPath);

// Configuração do Chatbot
const manager = new NlpManager({ languages: ["pt"], forceNER: true, autoSave: true }); // Agora o autoSave está ativo

// Carregar modelo treinado ou treinar novamente
(async () => {
    if (fs.existsSync(modelFilePath)) {
        manager.load(modelFilePath);
    } else {
        manager.addDocument("pt", "Como faço para me inscrever?", "info.inscricao");
        manager.addDocument("pt", "Estou com dúvidas como posso falar com a atlética?", "info.contato");
        manager.addAnswer("pt", "info.inscricao", "Para se inscrever, acesse a página de inscrições e preencha o formulário.");
        manager.addAnswer("pt", "info.contato", "Para falar com a atlética, acesse a página de contato e envie uma mensagem.");
        await manager.train();
        manager.save(modelFilePath); // Salvar o modelo treinado
        console.log("Chatbot treinado e pronto para uso.");
    }
})();

// Rota para processar mensagens do chatbot
const { getModalidades, getEventos, getLojas } = require("./models/post");

app.use(bodyParser.json());

app.post('/chatbot', async (req, res) => {
    try {
        const userMessage = req.body.message; // Captura a mensagem do usuário
        const response = await manager.process('pt', userMessage); // Processa a mensagem com o NlpManager

        let reply = response.answer;

        // Respostas dinâmicas para modalidades
        if (response.intent === 'info.modalidades') {
            const modalidades = await getModalidades();
            reply = modalidades.length > 0 
                ? modalidades.map(modalidade => modalidade.modalidade).join(", ") 
                : "Atualmente não há modalidades disponíveis.";
        }

        // Respostas dinâmicas para eventos
        if (response.intent === 'info.eventos') {
            const eventos = await getEventos();
            reply = eventos.length > 0 
                ? eventos.map(evento => evento.evento).join(", ") 
                : "Não há eventos programados no momento.";
        }

        // Respostas dinâmicas para produtos da loja
        if (['info.lojas', 'produto', 'produtos', 'loja', 'loja virtual'].some(term => userMessage.toLowerCase().includes(term))) {
            const lojas = await getLojas();
            reply = lojas.length > 0 
                ? lojas.map(loja => loja.loja).join(", ") 
                : "No momento, não temos produtos na loja.";
        }

        res.json({ reply }); // Retorna a resposta para o usuário
    } catch (error) {
        res.status(500).json({ error: "Erro ao processar mensagem do chatbot: " + error });
    }
});  


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

// Configuração do bodyParser para interpretar JSON
app.use(bodyParser.json());  // Para requisições com JSON
app.use(bodyParser.urlencoded({ extended: true }));  // Para dados codificados em URL


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
    Loja.findAll()
        .then(lojas => {
            res.render("loja", { lojas });  // Renderizando para o template loja.handlebars
        })
        .catch((erro) => {
            res.send("Erro ao buscar produtos: " + erro);
        });
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
    Inscricao.findAll()
        .then(inscricoes => {
            res.render("consultarInscricao", { inscricoes: inscricoes });
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Erro ao carregar inscrições');
        });
});

// Rotas para editar uma inscrição
app.get("/editarInscricao/:id", (req, res) => {
    Inscricao.findByPk(req.params.id)
        .then((inscricao) => {
            if (inscricao) {
                res.render("editarInscricao", { inscricao });
            } else {
                res.send("Inscrição não encontrada.");
            }
        })
        .catch((erro) => res.send("Erro ao buscar inscrição: " + erro));
});

// Rota para atualizar uma inscrição
app.post("/atualizarInscricao/:id", (req, res) => {
    Inscricao.update(req.body, { where: { id: req.params.id } })
        .then(() => res.redirect("/consultarInscricao"))
        .catch((erro) => res.send("Erro ao atualizar inscrição: " + erro));
});

// Rota para deletar uma inscrição
app.post("/deletarInscricao/:id", (req, res) => {
    Inscricao.destroy({ where: { id: req.params.id } })
        .then(() => res.redirect("/consultarInscricao"))
        .catch((erro) => res.send("Erro ao deletar inscrição: " + erro));
});


// -> Contato - Mensagens de alunos e demais interessados
// Rota para consultar os contatos
app.get('/consultarContato', (req, res) => {
    Contato.findAll()  
        .then(contatos => {
            res.render('consultarContato', { contatos: contatos });
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Erro ao carregar contatos');
        });
});

// Rota para deletar um contato
app.post("/deletarContato/:id", (req, res) => {
    Contato.destroy({ where: { id: req.params.id } })
        .then(() => res.redirect("/consultarContato"))
        .catch((erro) => res.send("Erro ao deletar contato: " + erro));
});


// -> Loja 
// Rota para consultar os produtos da loja
app.get("/consultarLoja", (req, res) => {
    renderData(Loja, res, "consultarLoja", "lojas");
});

// Rota para cadastrar um novo produto na loja
app.get("/cadastrarLoja", (req, res) => {
    res.render("cadastrarLoja");
});

app.post("/cadastrarLoja", (req, res) => {
    Loja.create(req.body)
    .then(() => {
        console.log("Produto cadastrado com sucesso:", req.body);
        res.redirect("/consultarLoja");
    })
    .catch((erro) => res.send("Erro ao cadastrar produto: " + erro));
});

// Rota para editar um produto
app.get("/editarLoja/:id", (req, res) => {
    Loja.findByPk(req.params.id)
        .then((loja) => {
            if (loja) {
                res.render("editarLoja", { loja });
            } else {
                res.send("Produto não encontrado.");
            }
        })
        .catch((erro) => res.send("Erro ao buscar produto: " + erro));
});

// Rota para atualizar um produto
app.post("/atualizarLoja/:id", (req, res) => {
    Loja.update(req.body, { where: { id: req.params.id } })
        .then(() => res.redirect("/consultarLoja"))
        .catch((erro) => res.send("Erro ao atualizar produto: " + erro));
});

// Rota para deletar um produto
app.post("/deletarLoja/:id", (req, res) => {
    Loja.destroy({ where: { id: req.params.id } })
        .then(() => res.redirect("/consultarLoja"))
        .catch((erro) => res.send("Erro ao deletar produto: " + erro));
}); 


// -> Eventos e Campeonatos
// Rota para consultar os eventos
app.get("/consultarEvento", (req, res) => {
    renderData(Evento, res, "consultarEvento", "eventos");
});

// Rota para cadastrar um novo evento
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