require('dotenv').config();
const { CohereClient } = require("cohere-ai");

const { COHERE_KEY } = process.env;

const cohere = new CohereClient({
  token: COHERE_KEY,
});

exports.rerank = async (query, documents, model = 'rerank-english-v3.0') => {
    const sorted = await cohere.rerank({documents, query, topN: documents.length, model});
    console.log(sorted);
    return sorted;
}

// (async () => {
//   const response = await cohere.chat({
//     message: "hello world!",
//   });

//   console.log(response);
// })();
