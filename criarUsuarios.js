// Imports necessários
const bcrypt = require("bcrypt");
const { Usuario } = require("./models/post");  // Ajuste o caminho se necessário

// Função para criar usuário
async function criarUsuario(username, senha) {
    try {
        // Gera o hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedSenha = await bcrypt.hash(senha, salt);

        // Cria o usuário com a senha hashada
        await Usuario.create({ username, senha: hashedSenha });

        console.log(`Usuário ${username} criado com sucesso.`);
    } catch (erro) {
        console.error("Erro ao criar usuário:", erro);
    }
}

// criar usuários
criarUsuario("teste", "senha123");
criarUsuario("thais", "senha123");
