const readability = require('node-readability');

exports.htmlTextViaReadability = (html) => {
  return new Promise((resolve, reject) => {
    readability(html, (err, article, meta) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          textBody: article.textBody,
          title: article.title,
          meta: meta,
        });
        article.close();
      }
    });
  });
}

