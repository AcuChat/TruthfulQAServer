require('dotenv').config();
const mysql = require('mysql2');
const data = require('../TruthfulQA_generation.json');

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

const createTables = async () => {
    let q = `CREATE TABLE IF NOT EXISTS questions (
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

    let r = await this.query(q);

    q = `CREATE TABLE IF NOT EXISTS content (
        url VARCHAR(2048) CHARACTER SET ascii NOT NULL PRIMARY KEY,
        raw MEDIUMTEXT,
        md MEDIUMTEXT,
        json MEDIUMTEXT,
        status VARCHAR(64) DEFAULT 'init',
        INDEX(status)
    )`;

    r = await this.query(q);

    q = `CREATE TABLE IF NOT EXISTS sources (
        id BIGINT NOT NULL PRIMARY KEY,
        url VARCHAR(2048) CHARACTER SET ascii NOT NULL
    )`

    r = await this.query(q);
}

const initializeTable = async () => {
    const { validation } = data;
    for (let i = 0; i < validation.type.length; ++i) {
        const type = this.escape(validation.type[i]);
        const category = this.escape(validation.category[i]);
        const question = this.escape(validation.question[i]);
        const best_answer = this.escape(validation.best_answer[i]);
        const correct_answers = this.escape(JSON.stringify(validation.correct_answers[i]));
        const incorrect_answers = this.escape(JSON.stringify(validation.incorrect_answers[i]));
        const source = this.escape(validation.source[i]);

        const q = `INSERT INTO questions (type, category, question, best_answer, correct_answers, incorrect_answers, source) VALUES (
            ${type}, ${category}, ${question}, ${best_answer}, ${correct_answers}, ${incorrect_answers}, ${source}
        )`

        const r = await this.query(q);
    }
}

exports.wikipediaQuestions = async () => {
    const q = `SELECT id, question, source FROM questions WHERE source LIKE '%wikipedia%'`;
    const r = await this.query(q);

    return r;
}

exports.nextUnprocessedWiki = async () => {
    const q = `SELECT id, raw_content FROM sources WHERE content IS NULL LIMIT 1`;
    const r = await this.query(q);
    return r;

}

exports.resetContent = async () => {
    const q = `UPDATE sources SET content = NULL`;
    const r = await this.query(q);
    return r;
}

exports.getUrlStatus = async (url) => {
    const q = `SELECT status FROM content WHERE url = ${exports.escape(url)}`;
    const r = await exports.query(q);
    return r;
}

exports.addUrlRaw = async (url, raw) => {
    const q = `INSERT INTO content (url, raw) VALUES (${exports.escape(url)}, ${exports.escape(raw)}) ON DUPLICATE KEY UPDATE raw = VALUES(raw)`;
    const r = await exports.query(q);
    return r;
}

exports.addIdUrl = async (id, url) => {
    const q = `INSERT INTO sources (id, url) VALUES (${id}, ${exports.escape(url)}) ON DUPLICATE KEY UPDATE url = VALUES(url)`;
    const r = await exports.query(q);
    return r;
}

createTables();