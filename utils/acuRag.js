const mdUtil = require('./md');
const _ = require('lodash');

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
                for (let j = depth + 1; j <= 6; ++j) headings[`h${j}`] = '';
                break;
            }
        }

        if (handled) continue;
        line.index = index++;
        line.headings = _.cloneDeep(headings);
        line.blockQuoteHeadings = _.cloneDeep(blockQuoteHeadings);
        lines.push(line);

        if (lines.length > 2 && lines[lines.length-2].headings.h1) {
            console.log('\n\n\n');
            console.log(lines[lines.length-1]);
            break;
        }

        
    }

    return lines;
}