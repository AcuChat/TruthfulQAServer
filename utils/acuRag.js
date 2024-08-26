const mdUtil = require('./md');


exports.getLines = async (md) => {
    const rawLines = await mdUtil.mdToAcuJson(md);
    const lines = [];
    let index = 0;

    for (let i = 0; i < rawLines.length; ++i) {
        const line = rawLines[i];

        console.log('\n\n\n')
        console.log(line);

        const {category} = line;
    
        switch (category) {
            case 'previousLineIsHeading':
                if (lines.length) {
                    lines[lines.length-1].category = 'heading';
                    lines[lines.length-1].depth = 0;
                }
                break;
            case 'previousLineIsSubheading':
                if (lines.length) {
                    lines[lines.length-1].category = 'heading';
                    lines[lines.length-1].depth = 1;
                }
                break;
            case 'blockquotePreviousLineIsHeading':
                if (lines.length) {
                    lines[lines.length-1].category = 'blockquoteHeading';
                    lines[lines.length-1].depth = 0;
                }
                break;
            case 'blockquotePreviousLineIsSubheading':
                if (lines.length) {
                    lines[lines.length-1].category = 'blockquoteHeading';
                    lines[lines.length-1].depth = 1;
                }
                break;

        }
    
        break;
    }

    return lines;
}