require('dotenv').config();
const sql = require('./utils/sql');
const html = require('./utils/html');
const axios = require('axios');
const md = require('./utils/md');

function extractWikipediaUrl(text) {
    // Define the regex pattern for Wikipedia URLs
    const pattern = /https?:\/\/(?:\w+\.)?wikipedia\.org\/[^\s]+/;
    
    // Search for the first Wikipedia URL in the text
    const match = text.match(pattern);
    
    // If a match is found, return the URL; otherwise, return null
    return match ? match[0] : '';
}

function isValidUrl(str) {
    try {
        // Attempt to create a new URL object
        new URL(str);
        return true;
    } catch (e) {
        // If an error is thrown, the string is not a valid URL
        return false;
    }
}

const storeWikiHtml = async () => {
    const wiki = await sql.wikipediaQuestions();
   
    for (let i = 0; i < wiki.length; ++i) {    
        let url = extractWikipediaUrl(wiki[i].source);
        url = url.replaceAll(';', '');
        const isUrl = isValidUrl(url);
        if (!isUrl) continue;

        const response = await axios.get(url);
        const q = `INSERT INTO sources (id, raw_content) VALUES (${wiki[i].id}, ${sql.escape(response.data)})`;
        const r = await sql.query(q);
    }
}



const processContent = async () => {
    while (true) {
        const wiki = await sql.nextUnprocessedWiki();
        if (!wiki.length) return;
        // const article = await html.htmlToTextViaReadability(wiki[0].raw_content);
        // const fullArticle = article.title && article.textBody ? article.title + "\n\n" + article.textBody : '';
        const fullArticle = html.htmlToMarkdownViaTurndown(wiki[0].raw_content, true);

        if (fullArticle) {
            const q = `UPDATE sources SET content = ${sql.escape(fullArticle)} WHERE id = ${wiki[0].id}`;
            const r = await sql.query(q);
            console.log('id', wiki[0].id);
        }
    }
    
}

const mdToJson = async (num) => {
    const q = `SELECT content FROM sources LIMIT ${num}`;
    const r = await sql.query(q);

    for (let i = 0; i < num; ++i) {
        const result = md.mdToAcuJson(r[i].content);
        if (result === false) break;
    }
}

//sql.resetContent();
//processContent();
//mdToJson(5);