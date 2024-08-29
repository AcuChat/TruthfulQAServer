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
        console.log('parts', parts)
        line.linkText = parts.plaintext;
        line.links = parts.links;
        console.log(line);
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
        if (line.images.length) {
            console.log(line);
        }
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
        console.log('line.formatting', line.formatting)
        for (let j = 0; j < line.formatting.length; ++j) {
            citText = citText.replace(line.formatting[j].fullText, line.formatting[j].plainText)
        }
        line.formText = citText;
        if (line.formatting.length) console.log('EHLO', line);
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

    return lines;
}

exports.getSentences = async (lines) => {
    const paragraphs = lines.map(line => line?.citText ? line.citText : '');
    getCurrentTime();
    // const sentsStr = await spacy.spacy('sentences', {content: paragraphs.join("\n")});
    // const sentsArr = JSON.parse(sentsStr);
    // const sents = sentsArr.map(s => s.sent);
    const sents = await services.splitSentences(paragraphs.join("\n"));
    getCurrentTime();
    console.log('sents', sents);
    return sents;
}

