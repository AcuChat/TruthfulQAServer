require('dotenv').config();
const sql = require('./utils/sql');
const html = require('./utils/html');
const axios = require('axios');
const mdUtil = require('./utils/md');
const acuRag = require('./utils/acuRag');
const services = require('./utils/services');
const wikipedia = require('./utils/wikipedia');
const steps = require('./utils/steps');
const qdrant = require('./utils/qdrant');

const fs = require ('fs');

const { v4: uuidv4 } = require('uuid');

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

const getSentencesFromUrl = async (testUrl = false) => {
    const q = testUrl ? 
        `SELECT url FROM content WHERE url = '${testUrl}'` :
        `select url from content`
    const wikiUrls = await sql.query(q);
    for (let i = 0; i < wikiUrls.length; ++i) {
        console.log('THE URL', wikiUrls[i].url);
        fs.writeFileSync('/home/tmp/urls.txt', wikiUrls[i].url + '\n', 'utf-8');
        const article = await wikipedia.getArticleUrlViaCheerio(wikiUrls[i].url);
        const md = html.htmlToMarkdownViaTurndown(article);
        await sql.query(`UPDATE content SET md = ${sql.escape(md)} WHERE url = ${sql.escape(wikiUrls[i].url)}`);
        const lines = await acuRag.getLines(md);
        if (lines === false) break;
        await acuRag.getSentences(lines);
        await sql.query(`UPDATE content SET json = ${sql.escape(JSON.stringify(lines))} WHERE url = ${sql.escape(wikiUrls[i].url)}`);
    }
    
    
    //const paragraphs = lines.map(line => line.sentences.join(" "));
    //console.log(paragraphs);
    //const paragraphChunks = acuRag.paragraphChunks(paragraphs);
    //console.log(paragraphChunks);
    //console.log(paragraphChunks.length);
    //const result = await steps.simplifyRoutes(paragraphChunks);
    //console.log(result);
}

const createSourceTable = async id => {
    const q = `CREATE TABLE IF NOT EXISTS source_${id} (
        num BIGINT PRIMARY KEY,
        line MEDIUMTEXT
    )`;
    
    const r = await sql.query(q);

    return r;
}

const test = async () => {
    let response = await sql.query(`SELECT id, url FROM content`);
    for (let i = 0; i < response.length; ++i) {
        const { id, url } = response[i];
        await createSourceTable(id);
        const info = await sql.query(`SELECT json FROM content WHERE id = '${id}'`);
        const lines = JSON.parse(info[0].json);
        for (let j = 0; j < lines.length; ++j) {
            await sql.query(`INSERT INTO source_${id} (num, line) VALUES (${j}, ${sql.escape(JSON.stringify(lines[j]))})`);
        }
        console.log(id, url);
    }
    
    console.log(`source_${response[0].id}`);
    //response = await sql.query(`SELECT id, url FROM content`);
    //console.log(response);
}

const createCollection = async (id) => {
    console.log('createCollection', id);
}

const qa = async () => {
    //console.log('hello qa');

    // get questions
    const questions = await sql.questions();
    for (let i = 0; i < questions.length; ++i) {
        const id = await sql.urlId(questions[i].source);
        
        // skip over non-wikipedia sources
        if (!id) continue;
        
        console.log(questions[i]);
        console.log('id', id);
        
        const info = await qdrant.collectionInfo(id);
        let collectionExists = true;
        if (info?.status?.error) collectionExists = false;

        if (!collectionExists) await (createCollection(id));

        

        
        break;
    }
}

//storeWikiHtml();
//sql.resetContent();
//processContent();
//mdToJson(100);

//test();
//test('https://en.wikipedia.org/wiki/Evolution');


qa();