require('dotenv').config();
const { CohereClient } = require("cohere-ai");

const { COHERE_KEY } = process.env;

const cohere = new CohereClient({
  token: COHERE_KEY,
});

(async () => {
  const response = await cohere.chat({
    message: "hello world!",
  });

  console.log(response);
})();
