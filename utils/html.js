const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const TurndownService = require('turndown');

exports.htmlToMarkdownViaTurndown = (html) => {
    const dom = new JSDOM(html);
    const bodyInnerHTML = dom.window.document.body.innerHTML;
    
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(bodyInnerHTML);
    
    return markdown;
}

exports.htmlToTextViaJsdom = async (html) => {
    const dom = new JSDOM(html);
    const textContent = dom.window.document.body.textContent;
    return textContent;
}

exports.htmlToTextViaReadability = (html) => {
    return new Promise((resolve, reject) => {
        try {
        const dom = new JSDOM(html);
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        
        if (article) {
            resolve({
            textBody: article.textContent,
            title: article.title,
            });
        } else {
            reject(new Error('Article could not be parsed.'));
        }
        } catch (error) {
        reject(error);
        }
    });
}
