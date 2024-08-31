const mdUtil = require('./md');
const _ = require('lodash');
const spacy = require('./spacy');
const services = require('./services');

function getCurrentTime() {
    const now = new Date();
    
    // Get hours, minutes, and seconds
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    
    // Pad with leading zeros if necessary
    hours = hours.toString().padStart(2, '0');
    minutes = minutes.toString().padStart(2, '0');
    seconds = seconds.toString().padStart(2, '0');
    
    console.log(`${hours}:${minutes}:${seconds}`)
    // Combine into hh:mm:ss format
    return `${hours}:${minutes}:${seconds}`;
}

const extractLinkText = lines => {
    let count = 0;
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];
        const { raw } = line;
        //let test = mdUtil.containsMarkdownLinks(raw);
        const parts = mdUtil.parseMarkdownLinks(raw);
        line.linkText = parts.plaintext;
        line.links = parts.links;
        // if (test) {
        //     console.log("FOUND LINK");
        //     console.log(raw);
        //     console.log(parts)
        //     console.log(`\n\n`);
        //     ++count;
        // }
    }
}

const extractImageText = lines => {
    let count = 0;
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];
        let { linkText } = line;
        line.images = mdUtil.parseMarkdownImages(linkText);
        for (let j = 0; j < line.images.length; ++j) {
            linkText = linkText.replace(line.images[j].fullText, line.images[j].alt);
        }
        line.imgText = linkText;
    }
}

const extractBibliographicCitations = lines => {
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];
        let { imgText } = line;
        line.citations = mdUtil.extractBibliographicCitations(imgText)
        for (let j = 0; j < line.citations.length; ++j) {
            imgText = imgText.replace(line.citations[j].fullText, line.citations[j].title);
        }
        line.citText = imgText;
    }
}

const extractMarkdownFormatting = lines => {
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];
        let { citText } = line;
        line.formatting = mdUtil.extractMarkdownFormatting(citText);
        for (let j = 0; j < line.formatting.length; ++j) {
            citText = citText.replace(line.formatting[j].fullText, line.formatting[j].plainText)
        }
        line.formText = citText;
    }
}

const removeMarkdownEscapes = lines => {
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];
        let { formText } = line;
        line.plainText = formText.replace(/\\([[\]\\])/g, '$1');
    }
}

exports.getLines = async (md) => {
    const rawLines = await mdUtil.mdToAcuJson(md);
    const lines = [];
    let index = 0;
    const headings = {
        h1: '',
        h2: '',
        h3: '',
        h4: '',
        h5: '',
        h6: ''
    }
    const blockQuoteHeadings = 
    {
        h1: '',
        h2: '',
        h3: '',
        h4: '',
        h5: '',
        h6: ''
    }

    for (let i = 0; i < rawLines.length; ++i) {
        const line = _.cloneDeep(rawLines[i]);

        const {category} = line;
    
        let handled = false;
        switch (category) {
            case 'blankLine':
            case 'whitespace':
                handled = true;
                break;
            case 'previousLineIsHeading':
                if (lines.length) {
                    lines[lines.length-1].category = 'heading';
                    lines[lines.length-1].depth = 0;
                }
                handled = true;
                break;
            case 'previousLineIsSubheading':
                if (lines.length) {
                    lines[lines.length-1].category = 'heading';
                    lines[lines.length-1].depth = 1;
                }
                handled = true;
                break;
            case 'blockquotePreviousLineIsHeading':
                if (lines.length) {
                    lines[lines.length-1].category = 'blockquoteHeading';
                    lines[lines.length-1].depth = 0;
                }
                handled = true;
                break;
            case 'blockquotePreviousLineIsSubheading':
                if (lines.length) {
                    lines[lines.length-1].category = 'blockquoteHeading';
                    lines[lines.length-1].depth = 1;
                }
                handled = true;
                break;
            case 'heading': {
                let { depth } = line;
                ++depth;
                headings[`h${depth}`] = line.raw;
                // reset all depths greater than current depth
                for (let j = depth + 1; j <= 6; ++j) headings[`h${j}`] = '';
                break;
            }
            case 'blockquoteHeading':
                /**
                 * TODO
                 */
                break;
        }

        if (handled) continue;

        // Assign intro field

        let intro = '';
        if (line?.raw && line.raw.endsWith(':')) intro = line.raw;
        else if (i < rawLines.length - 1) {
            const nextCategory = rawLines[i+1].category;
            test1 = nextCategory.startsWith('list');
            test2 = !category.startsWith('list');
            if (test1 && test2) intro = line.raw;
        }
        
        if (index > 0 && !intro) intro = lines[index-1].intro;

        line.intro = intro;

        line.index = index++;
        line.headings = _.cloneDeep(headings);
        line.blockQuoteHeadings = _.cloneDeep(blockQuoteHeadings);
        lines.push(line);

        // if (lines.length > 2 && lines[lines.length-2].intro) {
        //     console.log('\n\n\n');
        //     console.log(lines[lines.length-2], lines[lines.length-1]);
        //     break;
        // }
        
    }

    extractLinkText(lines);
    extractImageText(lines);
    extractBibliographicCitations(lines);
    extractMarkdownFormatting(lines);
    removeMarkdownEscapes(lines);

    return lines;
}

exports.getSentences = async (lines, max = 20) => {
    /** 
     * TODO: Setup multiple sentence splitters on GPUs and process the sentences in parallel batches
     */

    let count = 0;

    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];
        if (!line?.plainText) {
            line.sentences = [];
        } else {
            const words = line.plainText.split(" ");
            if (words.length <= max) line.sentences = [line.plainText];
            else {
                line.sentences = await services.splitSentences(line.plainText);
            }
        }
    }

    return;
}

exports.paragraphChunks = (paragraphs, maxChars = 1000) => {
    const chunks = [];
    let index = 0;
    let length = 0;
    let chunk = [];

    for (let i = 0; i < paragraphs.length; ++i) {
        const test = length + paragraphs[i].length;
        console.log(test);
        if (test <= maxChars) {
            length = test;
            chunk.push(paragraphs[i]);
        } else {
            console.log(chunk.join("\n"));
            chunks.push(chunk.join("\n"));
            chunk.push(paragraphs[i]);
            length = paragraphs[i].length;
        }
    }
    if (chunk.length) chunks.push(chunk.join("\n"));
    return chunks;
}