const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const TurndownService = require('turndown');

exports.htmlToMarkdownViaTurndown = (html, stripCss = false) => {
    const dom = new JSDOM(html);
    const bodyInnerHTML = dom.window.document.body.innerHTML;
    
    if (!stripCss) {
        const turndownService = new TurndownService();
        const markdown = turndownService.turndown(bodyInnerHTML);
        
        return markdown;
    }

    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        emDelimiter: '_'
      });
      
      // Add a rule to remove all class attributes
      turndownService.addRule('removeClasses', {
        filter: function (node) {
          return node.nodeType === Node.ELEMENT_NODE;
        },
        replacement: function (content, node, options) {
          node.removeAttribute('class');
          return content;
        }
      });
      
      // Use the modified turndownService to convert HTML to Markdown
      const markdown = turndownService.turndown(html);
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
