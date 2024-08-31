const fs = require('fs');
const plaintify = require('marked-plaintify');

const markdownLinkRegex = /^\[([^\]]+)\]\(([^)]+)\)$/; // presumes the link starts at the beginning with no preceding spaces
const listItemLinkRegex = /^\s*[\*\+\-]\s+\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;
const listItemLinkDepthRegex = /^(\s*)([*+-])\s+(\[)/;
// Regular expression to match a markdown link
//const linkRegex = /^(\s*)\[([^\]]*(?:\[[^\]]*\][^\]]*)*)\]\(([^)]+)\)$/; // allows for spaces prior to the beginning of the link
//const linkRegex = /^(\s*)(!?\[(?:[^\[\]]|\[[^\[\]]*\])*\])(\((?:[^()]|\([^()]*\))*\))(\s*)$/;
//const linkRegex = /^(\s*)(!?\[(?:[^\[\]]|\[[^\[\]]*\])*\])(\((?:[^()]|\([^()]*(?:\([^()]*\)[^()]*)*\))*\))(\s*)$/;
const linkRegex = /^(\s*)(!?\[(?:[^\[\]]|\[[^\[\]]*\]|\[\[[^\[\]]*\]\])*\])(\((?:[^()]|\([^()]*(?:\([^()]*\)[^()]*)*\))*\))(\s*)$/
const letterRegex = /^\s*[a-zA-Z]/;
const beginningRegex = /\S+/;
const startsWithLetterOrBackslashRegex = /^[a-zA-Z\\]/;
const orderedListRegex = /^[0-9]+[.)]/;
const markdownTextRegex = /^[a-zA-Z0-9\\~^."'—]/;
const unorderdListTextRegex = /^\s*[*+-]\s+(.*)$/;
const orderedListTextRegex = /^\s*\d+\.\s+(.*)$/;
//const stringStartsWithLinkRegex = /^\[(?:[^\[\]]|\[(?:[^\[\]]|\[(?:[^\[\]]|\[[^\[\]]*\])*\])*\])*\]\([^\s()]+(?:\s+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?\)/;
//const stringStartsWithLinkRegex = /^\[(?:[^\[\]]|\[(?:[^\[\]]|\[(?:[^\[\]]|\[[^\[\]]*\])*\])*\])*\](?:\([^\s()]+(?:\s+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?\)|\[[^\]]*\])/
const stringStartsWithLinkRegex = /^\[(?:[^\[\]]|\[[^\[\]]*\])*\](?:\(.*?\)|\[.*?\])/
const previousLineIsHeadingRegex = /^\s*={2,}$/;
const previousLineIsSubheadingRegex = /^\s*-{2,}$/;
const entireLineIsImageRegex = /^!\[([^\]]*)\]\(([^\s\)]+)(?:\s+"([^"]*)")?\)$/;
const lineStartsWithImageRegex = /^!\[([^\]]*)\]\(([^\s\)]+)(?:\s+"([^"]*)")?\)/;

const headingTextRegex = /^\s*#+\s+(.+)$/;
const blockquoteRegex = /^((?:>\s*)+)(.*)$/;
const generalLinkRegex = /(!?\[(?:[^\[\]]|\[[^\[\]]*\])*\])(\((?:[^()]|\([^()]*(?:\([^()]*\)[^()]*)*\))*\))/;

function hasLineBreak(markdownLine) {
    // Trim the line to remove leading/trailing whitespace
    const trimmedLine = markdownLine.trim();
    
    // Check for explicit line break (two or more spaces at the end)
    if (/  $/.test(trimmedLine)) {
      return true;
    }
    
    // Check for backslash line break
    if (/\\$/.test(trimmedLine)) {
      return true;
    }
    
    // Check for HTML <br> tag
    if (/<br\s*\/?>/i.test(trimmedLine)) {
      return true;
    }
    
    // No line break detected
    return false;
  }

exports.containsMarkdownLinks = (content) => {
    // This regex looks for markdown links anywhere in the text
   
    
    // Test if the content contains at least one link
    return generalLinkRegex.test(content);
  }

exports.parseMarkdownLinks = (content) => {
    const linkRegex = /(!?\[(?<text>(?:[^\[\]]|\[[^\[\]]*\])*)\])(\((?<url>[^)"]+)(?:\s+"(?<title>[^"]*)")?\))/g;
    let plaintext = content;
    const links = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
        const { text, url, title } = match.groups;
        
        links.push({
        text: text,
        url: url,
        title: title || ''
        });

        // Replace the link with just the text for plaintext
        plaintext = plaintext.replace(match[0], text);
    }

    return {
        plaintext: plaintext,
        links: links
    };
}

exports.parseMarkdownImages = (text) => {
    const imageRegex = /!\[([^\]]*)\]\(([^\s\)]+)(?:\s+"([^"]*)")?\)/g;
    const images = [];
    let match;
    
    while ((match = imageRegex.exec(text)) !== null) {
        images.push({
            fullText: match[0],
            alt: match[1] || '',
            url: match[2],
            title: match[3] || ''
        });
    }
    
    return images;
}
exports.extractBibliographicCitations = (text) => {
  const citationPattern = /([A-Za-z]+,\s[A-Za-z]+(?:\s[A-Z]\.)?\s\((?:[A-Za-z]+\s)?\d{1,2},\s\d{4}\)\.\s"[^"]+"\.\s_[^_]+_\.(?:.*?(?=\n|\.\s|$)))/g;
  const titlePattern = /"([^"]+)"/;

  const citations = [];
  let match;

  while ((match = citationPattern.exec(text)) !== null) {
    const fullText = match[0].trim();
    const titleMatch = fullText.match(titlePattern);
    const title = titleMatch ? titleMatch[1] : '';

    citations.push({
      fullText: fullText,
      title: title
    });
  }

  return citations;
}

function isLikelyUrl(str) {
    return /https?:\/\/|www\.|\.\w+\//.test(str);
}

// exports.extractMarkdownFormatting = (line) => {
//     const result = [];
//     // Updated regex to be more specific about formatting patterns
//     const regex = /(\*\*\*|_\*\*|\*\*_|\*\*|___)(?!\s)(.+?)(?<!\s)\1|\b_((?!\s)(?:[^_]|(?<=\S)_(?=\S))+?)_\b/g;
//     let match;
  
//     while ((match = regex.exec(line)) !== null) {
//       const fullText = match[0];
//       const formatting = match[1] || '_'; // Handle single underscore case
//       const plainText = match[2] || match[4]; // match[4] for single underscore case
//       let type;
  
//       // Check if it's a false positive (e.g., part of a URL)
//       if (isLikelyUrl(fullText)) {
//         continue;
//       }
  
//       switch (formatting) {
//         case '***':
//         case '_**':
//         case '**_':
//           type = 'boldItalic';
//           break;
//         case '**':
//           type = 'bold';
//           break;
//         case '___':
//           type = 'italic';
//           break;
//         case '_':
//           // Additional check for single underscore to avoid false positives
//           if (fullText.startsWith('_') && fullText.endsWith('_') && fullText.length > 2) {
//             type = 'italic';
//           } else {
//             continue; // Skip this match if it's not a valid italic formatting
//           }
//           break;
//       }
  
//       result.push({
//         fullText,
//         type,
//         plainText
//       });
//     }
  
//     return result;
// }

exports.extractMarkdownFormatting = (line) => {
    const result = [];
    // Updated regex to be more flexible with what follows the formatting
    const regex = /(\*\*\*|_\*\*|\*\*_|\*\*|___)(?!\s)(.+?)(?<!\s)\1(?=[^a-zA-Z0-9]|$)|\b_((?!\s)(?:[^_]|(?<=\S)_(?=\S))+?)_\b/g;
    let match;
  
    while ((match = regex.exec(line)) !== null) {
      const fullText = match[0];
      const formatting = match[1] || '_'; // Handle single underscore case
      const plainText = match[2] || match[4]; // match[4] for single underscore case
      let type;
  
      // Check if it's a false positive (e.g., part of a URL)
      if (isLikelyUrl(fullText)) {
        continue;
      }
  
      switch (formatting) {
        case '***':
        case '_**':
        case '**_':
          type = 'boldItalic';
          break;
        case '**':
          type = 'bold';
          break;
        case '___':
          type = 'italic';
          break;
        case '_':
          // Additional check for single underscore to avoid false positives
          if (fullText.startsWith('_') && fullText.endsWith('_') && fullText.length > 2) {
            type = 'italic';
          } else {
            continue; // Skip this match if it's not a valid italic formatting
          }
          break;
      }
  
      result.push({
        fullText,
        type,
        plainText
      });
    }
  
    return result;
}

function isMarkdownLink(str) {
    return markdownLinkRegex.test(str);
}

function isListItemLink(markdownString) {
    return listItemLinkRegex.test(markdownString);
}

function getListItemLinkDepth(line) {
    const match = line.match(listItemLinkDepthRegex);
    
    if (match) {
      const spaces = match[1].length;
      return Math.floor(spaces / 4) + 1;
    }
    
    return 0;
}

function getLinkDepth(line) {
    // Trim trailing whitespace
    line = line.trimEnd();
    
    // Check if the line matches the link pattern
    const match = line.match(linkRegex);
    
    if (match) {
      // If it's a link, calculate the depth based on leading spaces
      const leadingSpaces = match[1];
      const depth = Math.floor(leadingSpaces.length / 4) + 1;
      return depth;
    } else {
      // If it's not a link, return 0
      return 0;
    }
}

function startsWithLetter(str) {
    return letterRegex.test(str);
}

function parseBeginning(input) {
    console.log(`parseBeginning(${input})`);
    // Trim any trailing whitespace to focus only on leading whitespace
    //const trimmedInput = input.trimEnd();
    
    // Count the number of leading whitespace characters
    //const startingWhitespace = trimmedInput.length - trimmedInput.trimStart().length;
    const startingWhitespace = (input.match(/^\s*/) || [''])[0].length;

    // Extract the first string after initial whitespace
    const match = input.match(beginningRegex);
    const string = match ? match[0] : '';
    
    console.log({
        startingWhitespace,
        string,
        init: string.length ? string[0] : '',
       
      })
    return {
      startingWhitespace,
      string,
      init: string.length ? string[0] : '',
     
    };
  }

function getTextLines (lines, index) {
    let count = 0;
    const textLines = [];

    /**
     * Concatenate line breaks (if any).
     */
    while ((index + count) < lines.length) {
        textLines.push(lines[index + count]);
        let test = lines[index + count].endsWith('\\');
        if (!test) test = lines[index + count].endsWith('  ');
        ++count;
        if (!test) break;
    }

    return { count, textLines };
}

function handleParagraph (lines, index, undefined = false) {
    console.log('\n\nhandleParagraph');
    /*
            Look for line breaks: https://commonmark.org/help/tutorial/03-paragraphs.html
            Text ends with a backslash or two spaces
        */

    // Also provide raw and plainText in meta

    const { count, textLines } = getTextLines(lines, index);
    
    return {
        category: undefined ? 'unknown' : 'paragraph', // paragraph
        inc: count,
        raw: textLines.join('')
    }
}



function handleLink (lines, index, beginning, maxLines=5) {
    console.log('\n\nhandleLink')
    const depth = Math.floor(beginning.startingWhitespace / 4);
    let text = lines[index].substring(beginning.startingWhitespace);

    console.log('link text', text);
    
    /** 
     * Three possibilities:
     *   1) Entire line is a link
     *   2) Line contains the beginning of a link
     *   3) Line contains link and other things and therefore is paragraph  
     */

    let count = 0;
    while (count < maxLines) {
        const isLink = linkRegex.test(text);
       
        if (isLink) {
            return {
                category: 'Link',
                raw: text,
                inc: count + 1
            }
        }
    
        let test = stringStartsWithLinkRegex.test(text);
        if (test) {
            return {
                category: 'paragraph',
                raw: text,
                depth,
                inc: count + 1
            }
        }

        ++count;
        text += lines[index + count];
    }

    return {
        category: 'undefined',
        inc:1
    }
}

function handleImage (lines, index, beginning) {
    const depth = Math.floor(beginning.startingWhitespace / 4);
    const text = lines[index].substring(beginning.startingWhitespace);

    console.log('image text', text);

    
    /** 
     * Three possibilities:
     *   1) Entire line is an image
     *   2) Line contains the beginning of an image
     *   3) Line contains image and other things and therefore is paragraph
     */

    const isImage = entireLineIsImageRegex.test(text);
    if (isImage) {
        return {
            category: 'Image',
            raw: lines[index],
            inc: 1
        }
    }
    const lineStartsWithFullImage = lineStartsWithImageRegex.test(text);
    if (lineStartsWithFullImage) {
        return {
            category: 'paragraph',
            raw: lines[index],
            inc: 1
        }
    }

    return {
        category: 'undefined',
        inc:1
    }
}

function handleList (lines, index, beginning, type) {
    const depth = Math.floor(beginning.startingWhitespace / 4);
    let match = type === 'unordered' ? 
        lines[index].match(unorderdListTextRegex) :
        lines[index].match(orderedListTextRegex);
    let text = match ? match[1] : '';
    
    console.log(`list text: =${text}=`);

    if (text[0] !== '[') console.log("IS NOT LINK");
    // Are we dealing with a link?
    if (text[0] === '[') {
        // if the full line is a link then we are done
        let test = linkRegex.test(text);
        if (test) {
            return {
                category: 'listLink',
                depth,
                type,
                raw: text,
                inc: 1
            }
        } else {
            console.log("FULL LINE IS NOT LINK");
        }

        // If we have a complete link plus other stuff then we are done
        let completeLink = stringStartsWithLinkRegex.test(text);
        if (completeLink) {
            return {
                category: 'listText',
                type,
                depth,
                raw: text,
                inc: 1
            }
        }
    
        // otherwise we have an incomplete link
        const maxLines = 10;
        let count = 1;
        while (count < maxLines && (index + count) < lines.length) {
            text += lines[index + count]; // add the next line
            ++count;
            match = text.match(stringStartsWithLinkRegex);
            const link = match ? match[0] : '';
            if (link) {
                if (link.length === text.length) {
                    return {
                        category: 'listLink',
                        depth,
                        type,
                        raw: text,
                        inc: count
                    }
                } 
                return {
                    category: 'listText',
                    type,
                    depth,
                    raw: text,
                    inc: count
                }
            }
        }
        return {
            category: 'unparsable',
            depth,
            raw: text,
            inc: count
        }
    }

    

    // Are we dealing with an image?
    if (text.length > 2 && text[0] === '!' && text[1] === '[') {
        let test = entireLineIsImageRegex.test(text);
        if (test) {
            return {
                category: 'listImage',
                depth,
                type,
                raw: text,
                inc: 1
            }
        }
        
        return {
            category: 'listText',
            type,
            inc: 1,
            depth,
            raw: text
        } 
    }


    
    // let test = markdownTextRegex.test(text);
    // if (text[0] === '_') test = true;
    // if (text[0] === '*') test = true;

    let test = hasLineBreak(text);

    if (!test) {
        return {
            category: 'listText',
            type,
            inc: 1,
            depth,
            raw: text
        }
    }
        // we need to check for line breaks


    return {
        category: 'undefined',
        depth,
        inc: 1
    }
}

function handleUnorderedList (lines, index, beginning) {
    console.log('\n\nhandleUnorderedList')
    return handleList(lines, index, beginning, 'unordered');
}

function handleOrderedList (lines, index, beginning) {
    console.log('\n\nhandleOrderedList')
    return handleList(lines, index, beginning, 'ordered');
}

function handleHeading (lines, index, beginning) {
    console.log()
    let level;
    switch (beginning.string) {
        case '#':
            level = 0;
            break;
        case '##':
            level = 1;
            break;
        case '###':
            level = 2;
            break;
        case '####':
            level = 3;
            break;
        case '#####':
            level = 4;
            break;
        case '######':
            level = 5;
            break;
        default: 
            return {
                category: 'paragraph',
                inc: 1,
                raw: lines[index]
            }
    }
    const match = lines[index].match(headingTextRegex);
    const headingText = match ? match[1] : '';

    return {
        category: 'heading',
        depth: level,
        raw: headingText,
        inc: 1
    }
}


function parseBlockQuote(line) {
    const regex = blockquoteRegex;
    const match = line.match(regex);

    if (match) {
        const quoteMarkers = match[1].replace(/[^>]/g, '');
        const quoteDepth = quoteMarkers.length;
        const content = match[2].trim();
        return { depth: quoteDepth, content: content };
    } else {
        return { depth: 0, content: line.trim() };
    }
}
function handleBlockquote (lines, index, beginning) {
    console.log('\n\nhandleBlockquote');
    const { depth, content} = parseBlockQuote(lines[index]);
   

    if (!content) {
        return {
            category: 'blockquoteBlankLine',
            inc: 1,
            raw: ''
        }
    }

    const contentBeginning = parseBeginning(content);
    console.log('contentBeginning', contentBeginning);
    
    if (orderedListRegex.test(contentBeginning.string)) return handleBlockquoteOrderedList(lines, index, beginning, contentBeginning);
    if (markdownTextRegex.test(contentBeginning.string)) return handleBlockquoteParagraph(lines, index, beginning, contentBeginning);

    if (contentBeginning.init === '-') {
        if (previousLineIsSubheadingRegex.test(lines[index])) {
          return {
             category: 'blockquotePreviousLineIsSubheading',
             inc: 1,
             raw: lines[index]
          }
        }
     }
 
    if (contentBeginning.init === '=') {
        if (previousLineIsHeadingRegex.test(lines[index])) {
        return {
            category: 'blockquotePreviousLineIsHeading',
            inc: 1,
            raw: lines[index]
        }
        }
    }

    if (contentBeginning.init === '*') {
        if (contentBeginning.string.startsWith('***')) return {
            category: 'blockquoteHorizontalRule',
            inc: 1
        }
    }

    switch (contentBeginning.init) {
        case '-':
        case '+':
            // undordered list
            return handleBlockquoteUnorderedList(lines, index, beginning, contentBeginning);
    }
    return {
        category: 'undefined',
        type: 'blockquote',
        inc: 1
    }
}

function handleBlockquoteOrderedList (lines, index, beginning, contentBeginning) {
    console.log('\n\nhandleBlockquoteOrderedList');
    return {
        category: 'undefined',
        type: 'blockquoteOrderedList',
        inc: 1
    }
}

function handleBlockquoteUnorderedList (lines, index, beginning, contentBeginning) {
    console.log('\n\nhandleBlockquoteUnorderedList')
    return {
        category: 'undefined',
        type: 'blockquoteUnorderedList',
        inc: 1
    }
}

function handleBlockquoteParagraph (lines, index, beginning, contentBeginning) {
    console.log('\n\nhandleBlockquoteParagraph');
    const { count, textLines } = getTextLines(lines, index);
    return {
        category: 'blockquoteParagraph',
        raw: textLines.join(''),
        inc: count
    }
}

function getCategory (lines, index) {
    console.log(`getCategoryines(${[index]})`);
    if (!lines[index]) return {
        category: 'blankLine',
        raw: '',
        depth: 0,
        inc: 1
    }

    let test;
    const beginning = parseBeginning(lines[index]);

    if (!beginning.string) {
        return {
            category: 'whitespace',
            raw: lines[index],
            depth: 0,
            inc: 1
        }
    }

    if (orderedListRegex.test(beginning.string)) return handleOrderedList(lines, index, beginning);
    // IMPORTANT: Test for ordered list must come before handleParagraph so numbers are checked
    if (markdownTextRegex.test(beginning.string)) return handleParagraph(lines, index, beginning);
    
    if (beginning.init === '-') {
       if (previousLineIsSubheadingRegex.test(lines[index])) {
         return {
            category: 'previousLineIsSubheading',
            inc: 1,
            raw: lines[index]
         }
       }
    }

    if (beginning.init === '=') {
        if (previousLineIsHeadingRegex.test(lines[index])) {
          return {
             category: 'previousLineIsHeading',
             inc: 1,
             raw: lines[index]
          }
        }
     }
 
    if (beginning.init === '*') {
        if (beginning.string.startsWith('***')) return {
            category: 'horizontalRule',
            inc: 1
        }
    }


    switch (beginning.init) {
        case '#':
            return handleHeading(lines, index, beginning);
        case '-':
        case '+':
            // undordered list
            return handleUnorderedList(lines, index, beginning);
        case '*':
            // if entire line starts with * followed by space then unordered list
            if (beginning.string === '*') return handleUnorderedList(lines, index, beginning);
            // otherwise it is bold or italic meaning paragraph
            return handleParagraph(lines, index, beginning);    
        case '(':        
        case '_':
            // can be bold or italic
            return handleParagraph(lines, index, beginning)
        case '`':
            // inline code `
            if (beginning.next != '`') return handleParagraph(lines, index, beginning);
            // code block ```
            break;
        case '>':
            // be sure to handle nested block quotes https://commonmark.org/help/tutorial/05-blockquotes.html
            return handleBlockquote(lines, index, beginning);
            break;
        case '[':
            return handleLink(lines, index, beginning);
        case '!':
            return handleImage(lines, index, beginning);
        case '|':
            // handle table here
            break;
        default:
            return handleParagraph(lines, index, true);
        
    }

    return {
        category: 'undefined',
        inc: 1
    }

}

/** 
 * Returns: 
 *  false if entire md is not parsable
 *  array of objects if parsable
 */

exports.mdToAcuJson = async (md) => {
    const json = [];
    let index = 0;
    const mdLines = md.split("\n");
    const jsonLines = [];

    /**
     * TODO
     * IMPORTANT: Detect alternate heading lines that affect PREVIOUS category
     */

    fs.writeFileSync('/home/tmp/mdToJson.txt', md, 'UTF-8');

    while (index < mdLines.length) {
        const category = getCategory(mdLines, index);
        category.start = index;
        category.end = index + category.inc - 1;

        jsonLines.push(category);

        console.log('category', category);

        if (category.category === 'undefined' || category === 'unknown') {
            console.log("CATEGORY ERROR: ", mdLines[index]);
            const beginning = parseBeginning(mdLines[index]);
            console.log('Beginning: ', beginning);
            console.log('next lines');
            console.log(mdLines[index+1]);
            console.log(mdLines[index+2]);
            console.log(mdLines[index+3]);
            console.log(mdLines[index+4]);
            console.log(mdLines[index+5]);

            return false;
        }
        console.log("LINE:", mdLines[index]);
        console.log(category);

        index += category.inc;
    }

    console.log('index, mdLines.length', index, mdLines.length);
    return jsonLines;    
}