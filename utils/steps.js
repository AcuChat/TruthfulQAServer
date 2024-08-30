require('dotenv').config();

const { OPEN_AI_KEY } = process.env;

const ai = require('./ai');

const returnEmptyArray = () => {
    return new Promise((resolve) => {
       resolve ({
           status: 'success',
           finishReason: 'no data',
           content: 'No facts to report'
         })
    })
   
   };
   
exports.getChatbotArticleBasedOnQueryFactSets = async (userId, queryFactSets, model = 'gpt-4', res, temperature = 0.7, max_tokens = null, html = true) => {
    
    const promises = [];
    systemPrompt = `Present the sections of facts in paragraphs using natural language.
    
    Solely present the facts.

    Preserve the same vocabulary as the facts.

    Do not add anything to the facts.

    Do not make any inferences.
    `;

    for (let i = 0; i < queryFactSets.length; ++i) {
        if (!queryFactSets[i].factSet.length) {
            promises.push(returnEmptyArray());
            continue;
        };
        const messages = ai.initialMessagePair(queryFactSets[i].factSet.join(""), systemPrompt);
        //debug.storeObj(messages, `ChatbotArticlePrompt_${i}`);
        promises.push(ai.openAIGenericChatCompletion(userId, OPEN_AI_KEY, model, messages, temperature || .4, max_tokens || null))
    }

    response = await Promise.all(promises);

    //debug.storeObj(response, 'ChatbotArticleResponses');
    
    for (let i = 0; i < response.length; ++i) {
        if (response[i].status !== 'success') {
            console.error('getChatbotArticleBasedOnQueryFactSets Error', response[i]);
            res.status(500).json("internal server error: getChatbotArticleBasedOnQueryFactSets");
            return false;
        }
    }

    const sections = [];

    for (let i = 0; i < response.length; ++i) {
        if (html) sections.push(`<p style="text-align:center; font-weight:bold; font-size:1.2rem; margin-bottom: .5rem;">${queryFactSets[i].query}</p>${response[i].content}`);
        else sections.push(`\n${queryFactSets[i].query}\n${response[i].content}`);
    }

    //debug.storeObj(sections, 'QueryFactsSections');
    
    return sections.join("\n\n");
}


exports.filterQuery = async (ownerId, query, res) => {
    const service = `You are an expert in categorizing prompts. You return the category of the provided Prompt. The categories are: Programming, Reasoning, Inference, Summarization, Exposition, and Answer Extraction.
    
    The response must be one of the above categories.`;
    const prompt = `${query}`;
    const messages = ai.initialMessagePair(prompt, service);
    const response = await ai.openAIGenericChatCompletion(OPEN_AI_KEY, 'gpt-4-turbo', messages, 0.4, numTokensReserved);
    if (response.status !== 'success') {
        res.status(500).json('unable to process filterQuery command');
        return false;
    }
    const { total_tokens } = response.usage;
    const answer = response.content.replace("The response is: ", "").replace("Category: ", "")
    return answer;
}

exports.splitQuery = async (ownerId, prompt, baseModel='gpt-3.5-turbo') => {
    let splitModel = '';
    let grammarModel = '';

    switch(baseModel) {
        case 'gpt-3.5-turbo':
            splitModel = "Split Prompts 100";
            grammarModel = "Correct Prompt Grammar 100";
            break;
        case 'gpt-4o-mini':
        case 'gpt-4o':
            splitModel = "Split Prompts 100 4o";
            grammarModel = "Correct Prompt Grammar 100 4o";
            break;
        default:
            splitModel = "Split Prompts 100";
            grammarModel = "Correct Prompt Grammar 100";
    }

    let response = await ai.queryFineTunedModelByName(ownerId, splitModel, prompt, ownerId);
    if (response.status !== 'success') {
        return {
            status: 'error',
            message: JSON.stringify(response)
        }
    }
    
    try {
        //console.log('splitQuery Resonse', response.content);
        const prompts = JSON.parse(response.content);
        const promises = [];
        for (let i = 0; i < prompts.length; ++i) promises.push(ai.queryFineTunedModelByName(ownerId,grammarModel, prompts[i], ownerId));
        const result = await Promise.all(promises);
        response = {
            status: 'success',
            finishReason: 'stop',
            content: result.map(r => r.content)
        }
    } catch (err) {
        response = {
            status: 'error',
            message: JSON.stringify(err, null, 4)
        }
    }
    return response;
}

exports.simplifyRoutes = async (text, baseModel='gpt-3.5-turbo') => {
    let simpleSentencesModel = '';
    let coreferenceModel = '';

    switch(baseModel){
        case 'gpt-3.5-turbo':
            simpleSentencesModel = "Simple Sentences 25";
            coreferenceModel = "Coreference Resolution Orig";
            break;
        case 'gpt-4o-mini':
        case 'gpt-4o':
            simpleSentencesModel = "Simple Sentences 25 4o";
            coreferenceModel = "Coreference Resolution Orig 4o";
            break;

        default:
            simpleSentencesModel = "Simple Sentences 25";
            coreferenceModel = "Coreference Resolution Orig";
    }

    let response;
    try {
        let response = await ai.queryFineTunedModelByName(ownerId, simpleSentencesModel, texts[i]))
       
        if (response.status !== 'success') {
            console.error('simplifyRoutes error', responses[i])
            return {
                status: 'error',
                message: 'unable to simplify routes'
            }
        }

        const simpleSentences = response.content;
        
        response = await ai.queryFineTunedModelByName(ownerId, coreferenceModel, responses[i].content))

        if (response.status !== 'success') {
            console.error('simplifyRoutes CoReferencedSteps error', responses[i])
            return {
                status: 'error',
                message: 'unable to simplify routes'
            }
        }

        const results = response.content;
        response = {
            status: 'success',
            reason: 'stop',
            content: results,
            simpleSentences
        }

    } catch (err) {
        console.error('simplifyRoutes error', err);
        response = {
            status: 'error',
            message: JSON.stringify(err, null, 4)
        }

    }

    return response;
}