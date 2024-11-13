const Sequelize = require("sequelize");
const sequelize = new Sequelize("11BD", "root", "", {
    host: "localhost",
    dialect: "mysql"
});

module.exports = {
    Sequelize: Sequelize,
    sequelize: sequelize
};