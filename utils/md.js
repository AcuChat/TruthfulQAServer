const fs = require('fs');

const markdownLinkRegex = /^\[([^\]]+)\]\(([^)]+)\)$/; // presumes the link starts at the beginning with no preceding spaces
const listItemLinkRegex = /^\s*[\*\+\-]\s+\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;
const listItemLinkDepthRegex = /^(\s*)([*+-])\s+(\[)/;
// Regular expression to match a markdown link
const linkRegex = /^(\s*)\[([^\]]*(?:\[[^\]]*\][^\]]*)*)\]\(([^)]+)\)$/; // allows for spaces prior to the beginning of the link
const letterRegex = /^\s*[a-zA-Z]/;
const beginningRegex = /\S+/;

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
        init: string.length ? string[0] : ''
      })
    return {
      startingWhitespace,
      string
    };
  }

function getCategory (line) {
    if (!line) return {
        category: 'blankLine',
        inc: 1
    }

    const beginning = parseBeginning(line);


    let test;

    /** 
     * First check if the line is simply narrative text
     */
    test = startsWithLetter(line);
    if (test) return {
        category: 'text',
        inc: 1
    }

    /**
     * Check for the category of an entire line first
     */

    // check if entire line is solely comprised of a link
    test = getLinkDepth(line);
    if (test) {
        return {
            category: 'link',
            inc: 1,
            meta: {
                depth: test
            }
        }
    }

    // check if the entire line is solely a list item comprised solely of a link
    test = getListItemLinkDepth(line);
    if (test) {
        return {
            category: 'listItemLink',
            inc: 1,
            meta: {
                depth: test
            }
        }
    }


    /** 
     * Check the category of the line type
     */

    console.log('beginning', beginning);

    if (beginning.string.startsWith('---')) return {
        category: 'horizontalRule',
        inc: 1
    }

    if (beginning.startingWhitespace === 0 && beginning.string === '') return {
        category: 'blankLine',
        inc: 1
    }

    return '';
}



exports.mdToAcuJson = async (md) => {
    const json = [];
    let index = 0;
    const mdLines = md.split("\n");

    fs.writeFileSync('/home/tmp/mdToJson.txt', md, 'UTF-8');

    while (index < mdLines.length) {
        const category = getCategory(mdLines[index]);
        if (!category) {
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
    
}