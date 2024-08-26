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

        if (lines.length > 2 && lines[lines.length-2].intro) {
            console.log('\n\n\n');
            console.log(lines[lines.length-2], lines[lines.length-1]);
            break;
        }

        
    }

    return lines;
}