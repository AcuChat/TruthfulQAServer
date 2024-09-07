// OpenAI Migration Guide: https://chat.openai.com/share/b175130a-0d77-465e-8187-59b92590df8b
require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");
const {OpenAI }  = require("openai");

const { OPEN_AI_KEY } = process.env;

exports.getEmbedding = async (openAiKey, input) => {
    //console.log('getEmbedding openAIKey', openAiKey)
    const openai = new OpenAI({
      apiKey: openAiKey // This is also the default, can be omitted
    });
      let embeddingResponse;
      try {
        embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input,
          })    
      } catch (err) {
        console.error('Axios err', err.response && err.response.data ? err.response.data : err);
        return false;
      }

      //console.log(embeddingResponse.data[0].embedding)
      
      return embeddingResponse.data[0].embedding;
}

exports.getEmbeddings = async (inputs) => {

  const openai = new OpenAI({
      apiKey: OPEN_AI_KEY
  });

  let embeddingResponse;
  try {
    const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: inputs,
    });

    // Extract and return an array of embeddings
    return embeddingResponse.data.map(item => item.embedding);

    } catch (error) {
        console.error('OpenAI API error:', error);

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }

        // Throw the error to be handled by the caller
        throw error;
    }

  // Extract and return an array of embeddings
  return embeddingResponse.data.map(item => item.embedding);
}
