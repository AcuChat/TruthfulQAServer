require('dotenv').config();
const sql = require('./utils/sql');
const axios = require('axios');




const main = async () => {
    const wiki = await sql.wikipediaQuestions();
    //console.log('wiki', wiki);

    for (let i = 0; i < wiki.length; ++i) {
        const response = await axios.get(wiki[i].source);
        const q = `INSERT INTO sources (id, raw_content) VALUES (${wiki[i].id}, ${sql.escape(response.data)})`;
        
    
        console.log(wiki[i].question);
    }
}

main();