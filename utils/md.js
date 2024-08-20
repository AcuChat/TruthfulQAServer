const markdownLinkRegex = /^\[([^\]]+)\]\(([^)]+)\)$/;

function isMarkdownLink(str) {
    return markdownLinkRegex.test(str);
}

exports.mdToAcuJson = async (md) => {
    console.log(md)
}