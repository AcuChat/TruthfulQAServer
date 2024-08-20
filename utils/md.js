const markdownLinkRegex = /^\[([^\]]+)\]\(([^)]+)\)$/;
const listItemLinkRegex = /^\s*[\*\+\-]\s+\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;

function isMarkdownLink(str) {
    return markdownLinkRegex.test(str);
}

function isListItemLink(markdownString) {
    return listItemLinkRegex.test(markdownString);
}

exports.mdToAcuJson = async (md) => {
    console.log(md)
}