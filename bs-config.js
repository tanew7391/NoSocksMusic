const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    proxy: `http://localhost:${process.env.PORT}`,
    files: ["**/*.css", "**/*.pug", "**/*.js"],
    ignore: ["node_modules"],
    reloadDelay: 10,
    ui: false,
    notify: false,
    port: 3000,
  };