// OpenAI Migration Guide: https://chat.openai.com/share/b175130a-0d77-465e-8187-59b92590df8b

const { Configuration, OpenAIApi } = require("openai");
const {OpenAI }  = require("openai");

exports.getEmbedding = async (openAiKey, input) => {
    console.log('getEmbedding openAIKey', openAiKey)
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

      console.log(embeddingResponse.data[0].embedding)
      
      return embeddingResponse.data[0].embedding;
}
