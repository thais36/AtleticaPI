const express = require("express");
const app = express();
const handlebars = require("express-handlebars").engine;
const bodyParser = require("body-parser");
const { Modalidade, Inscricao, Contato, Loja, Evento } = require("./models/post");

// Configuração do handlebars
app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Configuração do body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware para definir variáveis comuns
app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    next();
});

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

// Rota para inscrição para a atlética zona leste - alunos
app.get("/inscricao", (req, res) => res.render("inscricao"));

app.post("/cadastrarInscricao", (req, res) => {
    Inscricao.create(req.body)
        .then(() => res.redirect("/consultarInscricao"))
        .catch((erro) => res.send("Erro ao cadastrar inscrição: " + erro));
});

// Rota para a atlética zona leste - alunos e demais interessados
app.get("/contato", (req, res) => res.render("contato"));

app.post("/cadastrarContato", (req, res) => {
    Contato.create(req.body)
        .then(() => res.redirect("/consultarContato"))
        .catch((erro) => res.send("Erro ao cadastrar contato: " + erro));
});

// Rotas de exibição para Evento - alunos e demais interessados
app.get("/evento", (req, res) => {
    Evento.findAll()
        .then((eventos) => res.render("evento", { eventos }))
        .catch((erro) => res.send("Erro ao carregar eventos: " + erro));
});

// Rotas de exibição para Loja - alunos e demais interessados
app.get("/loja", (req, res) => {
    Loja.findAll()
        .then((lojas) => res.render("loja", { lojas }))
        .catch((erro) => res.send("Erro ao carregar lojas: " + erro));
});

// Página de gestão do site com links para os CRUDs de cada seção - Membros da gestão da atlética
app.get("/gestao", (req, res) => {
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

// Rotas para CRUD de Modalidades
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

app.get("/consultarModalidade", (req, res) => {
    Modalidade.findAll()
        .then((modalidades) => {
            res.render("consultarModalidade", { modalidades });
        })
        .catch((erro) => res.send("Erro ao carregar as modalidades: " + erro));
});


// Rotas para CRUD de Inscrições
app.get("/consultarInscricao", (req, res) => {
    Inscricao.findAll()
        .then((inscricoes) => res.render("consultarInscricao", { inscricoes }))
        .catch((erro) => res.send("Erro ao carregar inscrições: " + erro));
});

// Rotas para CRUD de Contatos
app.get("/consultarContato", (req, res) => {
    Contato.findAll()
        .then((contatos) => res.render("consultarContato", { contatos }))
        .catch((erro) => res.send("Erro ao carregar contatos: " + erro));
});

// Rotas para CRUD da Loja
app.get("/consultarLoja", (req, res) => {
    Loja.findAll()
        .then((lojas) => res.render("consultarLoja", { lojas }))
        .catch((erro) => res.send("Erro ao carregar lojas: " + erro));
});

app.get("/cadastrarLoja", (req, res) => {
    res.render("cadastrarLoja");
});

app.post("/cadastrarLoja", (req, res) => {
    Loja.create(req.body)
        .then(() => res.redirect("/consultarLoja"))
        .catch((erro) => res.send("Erro ao cadastrar produto na loja: " + erro));
});

// Rotas para CRUD de Eventos
app.get("/consultarEvento", (req, res) => {
    Evento.findAll()
        .then((eventos) => res.render("consultarEvento", { eventos }))
        .catch((erro) => res.send("Erro ao carregar eventos: " + erro));
});

app.get("/cadastrarEvento", (req, res) => {
    res.render("cadastrarEvento");
});

app.post("/cadastrarEvento", (req, res) => {
    Evento.create(req.body)
        .then(() => res.redirect("/consultarEvento"))
        .catch((erro) => res.send("Erro ao cadastrar evento: " + erro));
});

// Inicialização do servidor
app.listen(8081, () => console.log("Servidor ativo na porta 8081!"));
