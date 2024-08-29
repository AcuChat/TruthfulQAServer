require('dotenv').config();
const sql = require('./utils/sql');
const html = require('./utils/html');
const axios = require('axios');
const mdUtil = require('./utils/md');
const acuRag = require('./utils/acuRag');
const services = require('./utils/services');
const wikipedia = require('./utils/wikipedia');

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
        const { id, question, source } = wiki[i];
        console.log(id);
        let url = extractWikipediaUrl(source);
        url = url.replaceAll(';', '');
        const isUrl = isValidUrl(url);
        if (!isUrl) continue;

        // At this point, we have a wikipedia url

        url = html.stripAnchorFromUrl(url);

        // add id, url to sources table
        await sql.addIdUrl(id, url);
        
        // If we already have the url then skip it
        const status = await sql.getUrlStatus(url);
        if (status.length) continue;

        const response = await axios.get(url);
        const { data } = response;

        // add raw data to content (url, raw)
        await sql.addUrlRaw(url, data);

        console.log(url);
    }
}

const processContent = async () => {
    while (true) {
        const next = await sql.nextUnprocessedRaw();
        if (!next.length) return;
        const { url, raw } = next[0];
        const fullArticle = html.htmlToMarkdownViaTurndown(raw, true);

        if (fullArticle) {
            const q = `UPDATE content SET md = ${sql.escape(fullArticle)}, status = 'md' WHERE url = ${sql.escape(url)}`;
            const r = await sql.query(q);
            console.log('url', url);
        }
    }
}

const mdToJson = async (num) => {
    for (let i = 0; i < num; ++i) {
        let q = `SELECT url, md FROM content WHERE status = 'md' LIMIT ${num}`;
        let r = await sql.query(q);
        if (!r.length) break;
        const { url, md } = r[0];
        //const json = mdUtil.mdToAcuJson(md);
        
        const lines = await acuRag.getLines(md);
        console.log(lines[0], lines[1], lines[2])
        //console.log(lines);
        const sentences = await acuRag.getSentences(lines);

        console.log(`${sentences.length} sentence chunks`);
        console.log(i, url);
        // if (json === false) break;
        // q = `UPDATE content SET json = ${sql.escape(JSON.stringify(json))}, status = 'json' WHERE url = ${sql.escape(url)}`;
        // r = await sql.query(q);
        // console.log(r);
        break;
    }
}

const test = async () => {
    const wikiUrls = await sql.query(`select url from content limit 10`);
    const article = await wikipedia.getArticleUrlViaCheerio(wikiUrls[0].url);
    const md = html.htmlToMarkdownViaTurndown(article);
    console.log('article',article);
    console.log('md', md);

    const lines = await acuRag.getLines(md);
    // console.log('\n\n\nline', lines[0], lines[1], lines[2]);
    // const sentences = await acuRag.getSentences(lines);
}

//storeWikiHtml();
//sql.resetContent();
//processContent();
//mdToJson(100);

test();
