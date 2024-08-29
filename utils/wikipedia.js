const axios = require('axios');
const cheerio = require('cheerio');


exports.getArticleUrlViaCheerio = async url => {
  try {
    // Fetch the HTML content of the page
    const response = await axios.get(url);
    const html = response.data;

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script').remove();
    $('style').remove();
    $('link[rel="stylesheet"]').remove();

    // Find the main article content
    // You may need to adjust these selectors based on the website structure
    const articleSelectors = [
      'article',
      '.article',
      '.post',
      '.content',
      '#content',
      'main',
    ];

    let articleContent = '';

    for (const selector of articleSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        articleContent = element.html();
        break;
      }
    }

    if (!articleContent) {
      console.log('Could not find article content.');
      return null;
    }

    const $article = cheerio.load(articleContent);

    // Remove all class attributes
    $article('*').removeAttr('class');

    // Get the cleaned HTML
    articleContent = $article.html();

    // Clean up the extracted HTML
    articleContent = articleContent.trim();

    return articleContent;
  } catch (error) {
    console.error('Error extracting article content:', error.message);
    return null;
  }
}
