require('dotenv').config();
const mysql = require('mysql2');

const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT, JWT_PASSWORD } = process.env;

const mysqlOptions = {
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    port: MYSQL_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  }
  
  //const execAsync = promisify(exec);
  
  exports.escape = str => mysql.escape(str)
  
  exports.mysql = mysql;
  
  exports.pool = mysql.createPool(mysqlOptions);
  
  exports.query = q => {
    return new Promise((resolve, reject) => {
      this.pool.query(q, function(err, rows, fields) {
        console.error(err);
        if (err) return resolve(false);
        resolve(rows)
      });
    })
  }

  const createTable = async () => {
    const q = `CREATE TABLE IF NOT EXISTS questions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(64) NOT NULL,
        category VARCHAR(128) NOT NULL,
        question VARCHAR(512) NOT NULL,
        best_answer MEDIUMTEXT,
        correct_answers MEDIUMTEXT,
        incorrect_answers MEDIUMTEXT,
        source VARCHAR(2056) NOT NULL,
        acurai_response VARCHAR (4096) NOT NULL DEFAULT '',
        status VARCHAR(64) DEFAULT 'init'
    )`;

    const r = await this.query(q);
  }

  createTable();
  