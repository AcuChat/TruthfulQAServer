require('dotenv').config();
const sql = require('./utils/sql');
const axios = require('axios');

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

const main = async () => {
    const wiki = await sql.wikipediaQuestions();
    //console.log('wiki', wiki);

    for (let i = 0; i < wiki.length; ++i) {
       
        let url = extractWikipediaUrl(wiki[i].source);
        url = url.replaceAll(';', '');
        const isUrl = isValidUrl(url);
        if (!isUrl) continue;

        const response = await axios.get(url);
        const q = `INSERT INTO sources (id, raw_content) VALUES (${wiki[i].id}, ${sql.escape(response.data)})`;
        const r = await sql.query(q);
        console.log(wiki[i].question, url);
    }
}

main();