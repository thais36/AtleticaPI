const express = require("express");
const app = express();
const handlebars = require("express-handlebars").engine;
const bodyParser = require("body-parser");
const { Modalidade, Inscricao, Contato, Loja, Evento } = require("./models/post");

// Configuração para servir arquivos estáticos
app.use(express.static("public"));

// Configuração do handlebars
app.engine("handlebars", handlebars({
    defaultLayout: "main",
    helpers: {
        formatDate: function(date) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(date).toLocaleDateString('pt-BR', options);
        }
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
const renderData = (model, res, viewName) => {
    model.findAll()
        .then((data) => {
            res.render(viewName, { data });
        })
        .catch((erro) => {
            res.send(`Erro ao carregar ${viewName}: ` + erro);
        });
};

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
    renderData(Evento, res, "evento");
});

// Rotas de exibição para Loja - alunos e demais interessados
app.get("/loja", (req, res) => {
    renderData(Loja, res, "loja");
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
    renderData(Modalidade, res, "consultarModalidade");
});

// Rotas para CRUD de Inscrições
app.get("/consultarInscricao", (req, res) => {
    renderData(Inscricao, res, "consultarInscricao");
});

// Rotas para CRUD de Contatos
app.get("/consultarContato", (req, res) => {
    renderData(Contato, res, "consultarContato");
});

// Rotas para CRUD da Loja
app.get("/consultarLoja", (req, res) => {
    renderData(Loja, res, "consultarLoja");
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
    renderData(Evento, res, "consultarEvento");
});

app.get("/cadastrarEvento", (req, res) => {
    res.render("cadastrarEvento");
});

app.post("/cadastrarEvento", (req, res) => {
    const eventoData = new Date(req.body.data); // Supondo que 'data' esteja no corpo da requisição
    const now = new Date();

    if (eventoData <= now) {
        return res.send("Erro: A data do evento deve ser uma data futura.");
    }

    Evento.create(req.body)
        .then(() => res.redirect("/consultarEvento"))
        .catch((erro) => res.send("Erro ao cadastrar evento: " + erro));
});

// Rota para exibir o formulário de edição de um evento específico
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

// Rota para processar a edição de um evento
app.post("/editarEvento/:id", (req, res) => {
    const eventoData = new Date(req.body.data);
    const now = new Date();

    if (eventoData <= now) {
        return res.send("Erro: A data do evento deve ser uma data futura.");
    }

    Evento.update(req.body, { where: { id: req.params.id } })
        .then(() => res.redirect("/consultarEvento"))
        .catch((erro) => res.send("Erro ao editar evento: " + erro));
});

// Rota para deletar um evento
app.post("/deletarEvento/:id", (req, res) => {
    Evento.destroy({ where: { id: req.params.id } })
        .then(() => res.redirect("/consultarEvento"))
        .catch((erro) => res.send("Erro ao deletar evento: " + erro));
});

// Inicialização do servidor
app.listen(8081, () => console.log("Servidor ativo na porta 8081!"));
