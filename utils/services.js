const axios = require('axios');

const sentenceSplitterHost = 'http://127.0.0.1:6101';

exports.splitSentences = async content => {
    const request = {
        url: `${sentenceSplitterHost}/split-sentences`,
        method: 'post',
        data: {
            content
        }
    }

    try {
        const response = await axios(request);
        const { status, data } = response.data;
        if (status === 'error') {
            console.error(data);
            return [];
        }
        return data;
    } catch (err) {
        console.error(err);
        return [];
    }
}

const test = async () => {
    const result = await exports.splitSentences("Hello my friend. How are you");
    console.log(result);
}

test();
