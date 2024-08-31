require('dotenv').config();
const axios = require('axios');
const fineTunedModels = require('../fineTunedModels.json');
const openaiTokenCounter = require('openai-gpt-token-counter');

const { OPEN_AI_KEY } = process.env;

const sleep = seconds => new Promise(r => setTimeout(r, seconds * 1000));


exports.initialMessagePair = (prompt, service = "You are a helpful assistant.") => {
    return [
        {
            role: 'system',
            content: service,

        },
        {
            role: 'user',
            content: prompt
        }
    ]
}

exports.moderateContent = async (query, passages) => {
    try {
      // Combine query and passages into one string for moderation
      const contentToModerate = query + '\n' + passages.join('\n');
   
      // Set up the request data
      const requestData = {
        input: contentToModerate
      };
   
      // Make the POST request to the moderation endpoint
      const response = await axios.post('https://api.openai.com/v1/moderations', requestData, {
        headers: {
          'Authorization': `Bearer ${OPEN_AI_KEY}`,
          'Content-Type': 'application/json'
        }
      });
   
      // Handle the response
      return response.data;
    } catch (error) {
      console.error('Error moderating content:', error);
      return false;
    }
}

exports.openAIGenericChatCompletion = async (userId, apiKey, model, messages, temperature = .7, max_tokens = null, maxRetries = 10) => {
    if (model === 'gpt-4o') model = 'gpt-4o-mini';

    const request = {
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'post',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        data: {
            model,
            messages,
            user: userId
        }
    }

    console.log('openAIRequest', request.data.messages);

    if (max_tokens !== null) request.data.max_tokens = max_tokens;
    if (temperature !== null) request.data.temperature = temperature;

    let success = false;
    let count = 0;
    let seconds = 3;

    while (!success) {
        try {
            result = await axios(request);
            success = true;
        } catch (err) {
            const status = err?.response?.status;
            const statusText = err?.response?.statusText;
            const data = err?.response?.data;

            console.error('OpenAI Error', status, statusText, data);

            if (!status || !statusText || !data) console.error(err);
            ++count;
            if (count >= maxRetries || (err.response.status >= 400 && err.response.status <= 499) ) {
                //console.log("STATUS 400 EXIT");
                console.error(err.response.data)
            
                return {
                    status: 'error',
                    number: err.response.status,
                    message: err.response.statusText,
                }
            }
            seconds *= 2;
            console.error(`${model} is busy. Sleeping now.`)
            await sleep(seconds);
            console.error(`Retrying query for ${model}`);
        }
    }

    const response = {
        status: 'success',
        finishReason: result.data.choices[0].finish_reason,
        content: result.data.choices[0].message.content,
        usage: result.data.usage
    }

    const totalTokens = response.usage.total_tokens;
    //const remainingTokens = await redis.chargeUser(userId, totalTokens, model);
    //console.log('remaining tokens, usage', remainingTokens, response.usage);

    // if (remainingTokens < 0) {
    //     response.status = 'error';
    //     response.message = 'out of tokens'
    // }

    return response;
}


exports.queryFineTunedOpenAiModel = async (userId, options, query) => {
    let { openAiKey, model, systemPrompt, preamble, temperature, max_tokens } = options;
    temperature = temperature || 0.7;
    max_tokens = max_tokens || null;
    preamble = preamble || '';
    systemPrompt = systemPrompt || '';

    const prompt = preamble + query;
    const messages = this.initialMessagePair(prompt, systemPrompt);
    const response = await this.openAIGenericChatCompletion(userId, openAiKey, model, messages, temperature, max_tokens);
    return response;
}

exports.queryFineTunedModelByName = async (userId, name, query) => {
    const ft = fineTunedModels.find(f => f.name === name);
    if (!ft) return false;
    const response = await this.queryFineTunedOpenAiModel(userId, ft, query);
    
    return response;
}

exports.customChatJSON = async (prompt, model, openAiKey, temperature = .7, service = 'You are a helpful, accurate assistant.', max_tokens = null, userId = null) => {
    const NUM_TOKENS_TO_RESERVE = 2000;
    max_tokens = NUM_TOKENS_TO_RESERVE;
   
    const messages = this.initialMessagePair(prompt, service);
    const response = await this.openAIGenericChatCompletion (openAiKey, model, messages, temperature, max_tokens);
    
    if (response.status !== 'success') return false;
    return JSON.parse(response.content);
}
exports.stratifyPrensentTenseSentences = async (sentences, model, openaiKey, userId = null) => {
    const service = `You are an expert in categorizing present-tense English sentences as either permanent or temporary. Permanent statements are those that remain true over time. Temporary statements are those that can be different over time. You return all sentences as a JSON array in the following format:
    {
    sentence: The original sentence goes here.
    category: 'permanent' or 'temporary'
    }`;

    const prompt = `'''${sentences.join("\n")}'''`;

    const response = await(this.customChatJSON(prompt, model, openaiKey, .4, service, userId));

    return response;
}
exports.numTokensForText = async (text, model = "gpt-3.5-turbo") => {
    const numTokens = await openaiTokenCounter.text(text, model)
    return numTokens;
}