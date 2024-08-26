const mdUtil = require('./md');

exports.getLines = async (md) => {
    const rawLines = await mdUtil.mdToAcuJson(md);
    const lines = [];

    for (let i = 0; i < rawLines.length; ++i) {
        console.log('\n\n\n')
        console.log(rawLines[i]);
        break;
    }

    return lines;
}