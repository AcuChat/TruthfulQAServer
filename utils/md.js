const markdownLinkRegex = /^\[([^\]]+)\]\(([^)]+)\)$/; // presumes the link starts at the beginning with no preceding spaces
const listItemLinkRegex = /^\s*[\*\+\-]\s+\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;
const listItemLinkDepthRegex = /^(\s*)([*+-])\s+(\[)/;
// Regular expression to match a markdown link
const linkRegex = /^(\s*)\[([^\]]+)\]\(([^)]+)\)$/; // allows for spaces prior to the beginning of the link
const letterRegex = /^\s*[a-zA-Z]/;

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

function getCategory (line) {
    let test;

    /** 
     * First check if the line is simply narrative text
     */
    test = startsWithLetter(line);
    if (test) return {
        category: 'text'
    }

    /**
     * Check for the category of an entire line first
     */

    // check if entire line is solely comprised of a link
    test = getLinkDepth(line);
    if (test) {
        return {
            category: 'link',
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
            meta: {
                depth: test
            }
        }
    }


    /** 
     * Check the category of the line type
     */



    return '';
}



exports.mdToAcuJson = async (md) => {
    const json = [];
    
    // loop through lines

    // get curCategory

    // switch on curCategory
        // each switch handler updates the json array and returns how many lines it processed

        // default
            // print the line that is not yet categorized and return false
            // later 
                // log the markdown document (the document and the line that could not be categorized)
                // send email

    // increment index by numProcessed lines

}