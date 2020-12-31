let searchConstraint = [{
    "text": "Gmail",
    "type": "a"
}
];

window.xpath = function(xpathToExecute) {
    var result = [];
    var nodesSnapshot = document.evaluate(xpathToExecute, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < nodesSnapshot.snapshotLength; i++) {
        result.push(nodesSnapshot.snapshotItem(i));
    }
    return result;
}

window.getText = function(text) {
    return `translate(normalize-space(${text}), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")`;
}

window.isElementReallyDisplayedInUI = function(element) {
    if (element.tagName.toLowerCase() === "html") {
        return true;
    } else {
        if (window.getComputedStyle(element).display === "none") {
            return false;
        } else {
            return isElementReallyDisplayedInUI(element.parentElement);
        }
    }
}

window.processUserData = function() {
    searchConstraint.forEach(c=>{
        c.text = c.text.toLowerCase();
        c.type = (!c.type || c.type === "") ? "*" : c.type.toLowerCase();
    }
    );
}

window.checkElementPresent = function(elePath) {
    let foundEle = xpath(elePath);
    if (foundEle && foundEle.length > 0 && foundEle.some(f=>isElementReallyDisplayedInUI(f))) {
        return {
            result: true,
            successPath: elePath
        };
    }
    return {
        result: false,
        successPath: ""
    };
}

window.checkDescendant = function(path, type, text) {
    let elePath = path + `/descendant::${type}${text}`;
    return checkElementPresent(elePath);
}

window.checkFollowing = function(path, type, text) {
    let elePath = path + `/following::${type}${text}`;
    return checkElementPresent(elePath);
}

window.checkRoot = function(path) {
    if (path === "/../*") {
        path = "//../*";
    }
    let foundEle = xpath(path);
    if (foundEle && foundEle.length > 0) {
        if (foundEle[0].tagName && foundEle[0].tagName.toLowerCase() === "html") {
            return {
                result: true,
                successPath: path
            };
        }
    }
    return {
        result: false,
        successPath: path
    };
}

window.findElement = function(bElePath, cDef) {
    let searchTextStr = (!cDef.text || cDef.text === "") ? "" : `[contains(${getText('text()')},"${cDef.text}")]`;

    // Search the descendant
    let descendantEle = checkDescendant(bElePath, cDef.type, searchTextStr);
    if (descendantEle.result) {
        bElePath = descendantEle.successPath;
        return bElePath;
    }

    // Search the following
    let followingEle = checkFollowing(bElePath, cDef.type, searchTextStr);
    if (followingEle.result) {
        bElePath = followingEle.successPath;
        return bElePath;
    }

    // Start the search one level up
    var rootCheck = checkRoot(`${bElePath}/../*`);
    if (rootCheck.result) {
        return rootCheck.successPath;
    }
    bElePath += "/..";
    return findElement(bElePath, cDef);
}

window.findByContext = function() {
    let elementPath = "";
    processUserData();
    if (searchConstraint.length > 0) {
        searchConstraint.forEach(c=>{
            elementPath = findElement(elementPath, c);
        }
        );
    }

    if (elementPath) {
        let elements = xpath(elementPath);
        elements.forEach(e=>{e.onclick = function() {console.log(`${e.textContent} button was clicked`)}});
        return elements.filter(e=>isElementReallyDisplayedInUI(e));
        //return elementPath;
    } else {
        return "Something Wrong in the Stack of Elements";
    }
}

findByContext();
