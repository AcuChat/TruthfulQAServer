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
    const q = `SELECT content FROM sources LIMIT ${num}`;
    const r = await sql.query(q);

    for (let i = 0; i < num; ++i) {
        const result = md.mdToAcuJson(r[i].content);
        if (result === false) break;
    }
}

//storeWikiHtml();
//sql.resetContent();
processContent();
//mdToJson(5);