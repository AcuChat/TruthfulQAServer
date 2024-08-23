const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const TurndownService = require('turndown');


// Function to remove CSS content from HTML string
exports.removeCSSContent = (html) => {
    // Remove CSS content
    html = html.replace(/\.[\w-]+\s*{[^}]*}/g, '');
    
    // Remove @media rules
    html = html.replace(/@media[^{]+{[^}]+}/g, '');
    
    // Remove any remaining lone curly braces
    html = html.replace(/[{}]/g, '');
    
    // Trim whitespace
    html = html.trim();
    
    return html;
}

exports.removeFullCSSContent = (html) => {
    // Remove all content between curly braces (CSS rules)
    html = html.replace(/\{[^}]+\}/g, '');
    
    // Remove class names
    html = html.replace(/\.\w+(-\w+)*/g, '');
    
    // Remove @media queries
    html = html.replace(/@media[^{]+\{[^}]+\}/g, '');
    
    // Remove any remaining CSS-like constructs
    html = html.replace(/[a-z-]+:[^;]+;/g, '');
    
    // Remove extra spaces and line breaks
    html = html.replace(/\s+/g, ' ').trim();
    
    return html;
  }

exports.htmlToMarkdownViaTurndown = (html, stripCss = false) => {
    const dom = new JSDOM(html);
    const bodyInnerHTML = dom.window.document.body.innerHTML;
    
    if (!stripCss) {
        const turndownService = new TurndownService();
        const markdown = turndownService.turndown(bodyInnerHTML);
        
        return markdown;
    }

    const TurndownService = require('turndown');

    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        emDelimiter: '_'
    });

    
    // Wrap the original turndown method
    const originalTurndown = turndownService.turndown;
    turndownService.turndown = function(html) {
        const htmlWithoutCSS = exports.removeFullCSSContent(html);
        return originalTurndown.call(this, htmlWithoutCSS);
    };
      
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
