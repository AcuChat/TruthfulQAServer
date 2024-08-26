require('dotenv').config();
const axios = require('axios');

const { SPACY_PORT } = process.env;

exports.spacy = async (endpoint, data) => {
    const request = {
        url: `http://127.0.0.1:${SPACY_PORT}/${endpoint}`,
        method: 'post',
        data
    }

    try {
        const response = await axios(request);
        return response?.data?.data;
    } catch (err) {
        console.error(err);
        return false;
    }
}

// const test = async () => {
//     const sentences = await this.spacy('instructions', {content: "Tom walked into a bar. Take the stairs. Turn left. You will see the room. The room is the green one. Walk in."});
//     console.log('instructions', sentences);
// }

// test();