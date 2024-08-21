const fs = require('fs');
const plaintify = require('marked-plaintify');

const markdownLinkRegex = /^\[([^\]]+)\]\(([^)]+)\)$/; // presumes the link starts at the beginning with no preceding spaces
const listItemLinkRegex = /^\s*[\*\+\-]\s+\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;
const listItemLinkDepthRegex = /^(\s*)([*+-])\s+(\[)/;
// Regular expression to match a markdown link
const linkRegex = /^(\s*)\[([^\]]*(?:\[[^\]]*\][^\]]*)*)\]\(([^)]+)\)$/; // allows for spaces prior to the beginning of the link
const letterRegex = /^\s*[a-zA-Z]/;
const beginningRegex = /\S+/;
const startsWithLetterOrBackslashRegex = /^[a-zA-Z\\]/;
const orderedListRegex = /^[0-9]+[.)]/;
const markdownTextRegex = /^[a-zA-Z\\~^=]/

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
        next: string.length > 1 ? string[1] : ''
      })
    return {
      startingWhitespace,
      string,
      init: string.length ? string[0] : '',
      next: string.length > 1 ? string[1] : ''
    };
  }

function handleParagraph (lines, index, beginning) {
    /*
            Look for line breaks: https://commonmark.org/help/tutorial/03-paragraphs.html
            Text ends with a backslash or two spaces
        */

    // Also provide raw and plainText in meta

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

    return {
        category: 'paragraph', // paragraph
        inc: count,
        meta: {
            raw: textLines.join('')
        }
    }
}

function handleOrderedList (lines, index, beginning) {

    return {
        category: 'undefined',
        inc:1
    }
}

function handleLink (lines, index, beginning) {
    const depth = Math.floor(beginning.startingWhitespace / 4);
    const text = lines[index].substring(beginning.startingWhitespace);
    console.log('link text', text);

    
    /** 
     * Three possibilities:
     *   1) Entire line is a link
     *   2) Line contains the beginning of a link
     *   3) Line contains link and other things and therefore is paragraph
     */

    const isLink = linkRegex.test(text);
    if (isLink) {
        return {
            category: 'Link',
            inc: 1
        }
    }
    return {
        category: 'undefined',
        inc:1
    }
}

function getCategory (lines, index) {
    console.log(`getCategoryines(${[index]})`);
    if (!lines[index]) return {
        category: 'blankLine',
        inc: 1
    }

    let test;
    const beginning = parseBeginning(lines[index]);
    
    if (markdownTextRegex.test(beginning.string)) return handleParagraph(lines, index, beginning);
    if (orderedListRegex.test(beginning.string)) return handleOrderedList(lines, index, beginning);
    
    if (beginning.init === '-') {
        if (beginning.string.startsWith('---')) return {
            category: 'horizontalRule',
            inc: 1
        }
    }
    if (beginning.init === '*') {
        if (beginning.string.startsWith('***')) return {
            category: 'horizontalRule',
            inc: 1
        }
    }


    console.log('switch', beginning.init, beginning);

    switch (beginning.init) {
        case '#':
            break;
        case '-':
        case '+':
            // undordered list
        case '*':
            // can be unordered list, bold, or italic
            // if beginning.next === ' ' then unordered list
        case '_':
            // can be bold or italic
            break;
        case '`':
            // inline code
            // or code block ```
            break;
        case '>':
            // be sure to handle nested block quotes https://commonmark.org/help/tutorial/05-blockquotes.html
            break;
        case '[':
            return handleLink(lines, index, beginning)
            break;
        case '!':
            // handle image here
            break;
        case '|':
            // handle table here
            break;
        
    }

    return {
        category: 'undefined',
        inc: 1
    }

}



exports.mdToAcuJson = async (md) => {
    const json = [];
    let index = 0;
    const mdLines = md.split("\n");

    fs.writeFileSync('/home/tmp/mdToJson.txt', md, 'UTF-8');

    while (index < mdLines.length) {
        const category = getCategory(mdLines, index);
        if (category.category === 'undefined') {
            console.log("CATEGORY ERROR: ", mdLines[index]);
            const beginning = parseBeginning(mdLines[index]);
            console.log('Beginning: ', beginning);
            console.log('next lines');
            console.log(mdLines[index+1]);
            console.log(mdLines[index+2]);
            console.log(mdLines[index+3]);
            console.log(mdLines[index+4]);
            console.log(mdLines[index+5]);

            return;
        }
        console.log("LINE:", mdLines[index]);
        console.log(category);

        index += category.inc;
    }

    console.log('index, mdLines.length', index, mdLines.length);
    
}