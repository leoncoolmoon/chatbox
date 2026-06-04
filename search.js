var matches;
var position;
const maxSearch = 10;
var searchCounter = 0;
window.addEventListener('load', () => {
    const toolbar = document.getElementById('toolbar');
    const display = document.getElementById('conversation-display');
    if (toolbar && display) {
        addSearch(toolbar, display);
    }
});
var searchedDiv;
var uiDiv;
var mousePosition;
var offset = [0, 0];
var isDown = false;
var floated = false;
//ideal 10 highlight color list
var idealcolor = ["#ffff00", "#ff00ff", "#00ffff", "#ff0000", "#00ff00", "#0000ff", "#ff8000", "#ff0080", "#80ff00", "#8000ff"];
function addSearch(toolDiv, targetDiv) {
    searchedDiv = targetDiv;
    uiDiv = toolDiv;
    // create the search tool
    const searchTool = document.createElement('div');
    searchTool.setAttribute('id', 'searchTool');
    searchTool.style.display = 'block';
    uiDiv.style.backgroundColor = "var(--toolbar-bg)";
    uiDiv.style.borderRadius = '4px';
    uiDiv.appendChild(searchTool);
    //create the search tool button
    const searchToolButton = document.createElement('button');
    searchToolButton.setAttribute('id', 'searchToolButton');
    searchToolButton.innerHTML = '<img src="search.svg" title = "search" style="height:1em;"/>';
    searchToolButton.addEventListener('click', function () {
        const isOpen = searchbar.style.display === 'flex';
        if (!isOpen) {
            // 打开：记录当前在屏幕上的实际位置，然后切换为 fixed 停在原地
            const rect = uiDiv.getBoundingClientRect();
            uiDiv.style.position = 'fixed';
            uiDiv.style.left = rect.left + 'px';
            uiDiv.style.top = rect.top + 'px';
            uiDiv.style.boxShadow = 'rgba(0, 0, 0, 0.5) 0.3em 0.3em 0.3em';
            searchbar.style.display = 'flex';
            this.innerHTML = '<img src="close.svg" title="close" style="height:1em;"/>';
            floated = true;
        } else {
            // 关闭：回到文档流，清除所有定位样式
            uiDiv.style.position = '';
            uiDiv.style.left = '';
            uiDiv.style.top = '';
            uiDiv.style.boxShadow = 'none';
            searchbar.style.display = 'none';
            this.innerHTML = '<img src="search.svg" title="search" style="height:1em;"/>';
            floated = false;
        }
    });
    const searchList = document.createElement('div');
    searchList.setAttribute('id', 'searchList');
    searchList.style.display = 'flex';
    searchTool.appendChild(searchList);
    searchList.appendChild(searchToolButton);

    const searchbar = document.createElement('div');
    searchbar.setAttribute('id', 'searchbar');
    searchbar.style.display = 'none';
    searchTool.appendChild(searchbar);
    searchbar.style.flexWrap = 'wrap';
    searchbar.style.justifyContent = 'flex-start';
    searchbar.style.alignItems = 'center';

    const searchInput = document.createElement('input');
    searchInput.setAttribute('type', 'text');
    searchInput.setAttribute('id', 'searchInput');
    searchInput.setAttribute('placeholder', 'Search');
    searchInput.style.width = 'fit-content';
    searchInput.addEventListener('keyup', function (e) {
        if (e.key === "Enter") {
            searchButton.click();
        }
    });
    const highlight = document.createElement('input');
    highlight.setAttribute('id', 'highlight');
    highlight.setAttribute('type', 'color');
    highlight.setAttribute('value', '#ffff00');
    highlight.style.backgroundColor = '#ffff00';
    highlight.setAttribute('title', 'Highlight Color');
    highlight.style.width = '1em';
    highlight.style.margin = '8px';
    highlight.addEventListener('input', function () {
        this.style.backgroundColor = this.value;
    });
    const caseSensitive = document.createElement('input');
    caseSensitive.setAttribute('id', 'caseSensitive');
    caseSensitive.setAttribute('type', 'checkbox');
    caseSensitive.setAttribute('value', 'caseSensitive');
    caseSensitive.style.display = 'none';
    const caseSensitiveLabel = document.createElement('label');
    caseSensitiveLabel.setAttribute('for', 'caseSensitive');
    caseSensitiveLabel.innerHTML = 'Aa';
    caseSensitiveLabel.style.margin = '8px';
    caseSensitiveLabel.style.color = '#888888';

    const matchWholeWord = document.createElement('input');
    matchWholeWord.setAttribute('id', 'matchWholeWord');
    matchWholeWord.setAttribute('type', 'checkbox');
    matchWholeWord.setAttribute('value', 'matchWholeWord');
    matchWholeWord.style.display = 'none';
    const matchWholeWordLabel = document.createElement('label');
    matchWholeWordLabel.setAttribute('for', 'matchWholeWord');
    matchWholeWordLabel.innerHTML = '〔ab〕';
    matchWholeWordLabel.style.color = '#888888';
    matchWholeWordLabel.style.margin = '8px 0px';

    const searchButton = document.createElement('button');
    searchButton.setAttribute('id', 'searchButton');
    searchButton.innerHTML = '✔';
    searchButton.addEventListener('click', function () {
        if (searchCounter < maxSearch) {
            var tagName = 'searchListItem' + (searchCounter + 1);
            highlight.value = highlight.value != "#000000" ? highlight.value : idealcolor[searchCounter % 10];
            highlight.style.backgroundColor = highlight.value;
            if (highlightText(tagName, searchInput.value, highlight.value)) {
                searchCounter++;
                var searchListItem = document.createElement('div');
                searchListItem.innerHTML = searchInput.value;
                searchInput.value = '';
                searchListItem.style.display = 'inline-flex';
                searchListItem.style.margin = '0.25em';
                searchListItem.style.padding = '0.25em';
                searchListItem.style.borderRadius = '2px';
                searchListItem.style.backgroundColor = highlight.value;
                searchListItem.setAttribute('id', tagName);
                searchListItem.setAttribute('onclick', 'modifySearch(this)');
                searchList.appendChild(searchListItem);
                nextButton.style.display = 'block';
                previousButton.style.display = 'block';
                clearSearch.style.display = 'block';
                highlight.value = idealcolor[searchCounter % 10];
                highlight.style.backgroundColor = highlight.value;
            } else {
                alert('No matches found');
            }
        } else {
            alert('You have reached the maximum number of searchs');
        }
    });
    const nextButton = document.createElement('button');
    nextButton.setAttribute('id', 'nextButton');
    nextButton.style.display = 'none';
    nextButton.innerHTML = '▶';
    nextButton.onclick = () => nextSearch();
    const previousButton = document.createElement('button');
    previousButton.setAttribute('id', 'previousButton');
    previousButton.style.display = 'none';
    previousButton.innerHTML = '◀';
    previousButton.onclick = () => previousSearch();

    const clearSearch = document.createElement('button');
    clearSearch.setAttribute('id', 'clearSearch');
    clearSearch.innerHTML = '✘';
    clearSearch.style.display = 'none';
    clearSearch.addEventListener('click', function () {
        const spans = searchedDiv.querySelectorAll("span");
        for (const span of spans) {
            span.outerHTML = span.innerHTML;
        }
        searchInput.value = '';
        highlight.value = '#ffff00';
        highlight.style.backgroundColor = '#ffff00';
        searchCounter = 0;
        searchList.innerHTML = '';
        searchList.appendChild(searchToolButton);
        nextButton.style.display = 'none';
        previousButton.style.display = 'none';
        clearSearch.style.display = 'none';
    });
    searchbar.appendChild(searchInput);
    searchbar.appendChild(highlight);
    searchbar.appendChild(matchWholeWordLabel);
    searchbar.appendChild(matchWholeWord);
    searchbar.appendChild(caseSensitiveLabel);
    searchbar.appendChild(caseSensitive);
    searchbar.appendChild(clearSearch);
    searchbar.appendChild(previousButton);
    searchbar.appendChild(nextButton);
    searchbar.appendChild(searchButton);
    uiDiv.addEventListener('mousedown', dragStart);
    uiDiv.addEventListener('touchstart', dragStart, { passive: true });
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: true });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
}
function modifySearch(element) {
    unhighlightText(element.getAttribute('id'));
    searchInput.value = element.innerHTML;
    searchCounter--;
    var color = rgbtohex(element.style.backgroundColor);
    highlight.value = color != "#000000" ? color : idealcolor[searchCounter % 10];
    highlight.style.backgroundColor = highlight.value;
    element.remove();
    document.getElementById('nextButton').style.display = 'none';
    document.getElementById('previousButton').style.display = 'none';
    if (searchCounter == 0) {
        document.getElementById('clearSearch').style.display = 'none';
    }
}
var highlightItems = [];
var showPoint = 0;
function highlightText(tagName, searchText, color) {
    var toBeSearched = searchedDiv.innerHTML.toString();
    var pureText = searchedDiv.textContent;
    const caseSens = document.getElementById('caseSensitive').checked;
    const wholeWord = document.getElementById('matchWholeWord').checked;
    searchText = wholeWord ? '\\b' + searchText + '\\b' : searchText;
    matches = pureText.match(new RegExp(searchText, (caseSens ? "g" : "gi")));
    if (!matches) return false;
    var lastEnd = 0;
    highlightItems = [];
    for (const match of matches) {
        const span = document.createElement("span");
        span.style.color = color;
        span.className = tagName;
        span.textContent = match;
        var start = toBeSearched.indexOf(match, lastEnd);
        while (insideTag(toBeSearched, start)) {
            start = toBeSearched.indexOf(match, start + 1);
        }
        if (start != -1) {
            span.setAttribute('id', 'highlight' + start);
            var end = start + match.length;
            toBeSearched = toBeSearched.slice(0, start) + span.outerHTML + toBeSearched.slice(end);
            lastEnd = start + span.outerHTML.length;
            highlightItems.push({ start: start, text: match, end: lastEnd });
        }
    }
    searchedDiv.innerHTML = toBeSearched;
    if (highlightItems.length > 0) {
        searchedDiv.focus();
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(createRangeFromPosition(highlightItems[0]));
        document.getElementById('highlight' + highlightItems[0].start).scrollIntoView();
    }
    return true;
}
function insideTag(text, position) {
    return text.lastIndexOf("<", position) > text.lastIndexOf(">", position);
}
function unhighlightText(tagName) {
    const spans = searchedDiv.querySelectorAll("span");
    for (const span of spans) {
        if (span.className == tagName) {
            span.outerHTML = span.innerHTML;
        }
    }
}
function nextSearch() {
    if (highlightItems.length === 0) return;
    showPoint = (showPoint + 1) % highlightItems.length;
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(createRangeFromPosition(highlightItems[showPoint]));
    document.getElementById('highlight' + highlightItems[showPoint].start).scrollIntoView();
}
function previousSearch() {
    if (highlightItems.length === 0) return;
    showPoint = (highlightItems.length + showPoint - 1) % highlightItems.length;
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(createRangeFromPosition(highlightItems[showPoint]));
    document.getElementById('highlight' + highlightItems[showPoint].start).scrollIntoView();
}
function createRangeFromPosition(hl) {
    let range = document.createRange();
    let node = document.getElementById("highlight" + hl.start);
    if (node && node.firstChild) {
        range.setStart(node.firstChild, 0);
        range.setEnd(node.firstChild, hl.text.length);
    }
    return range;
}
function rgbtohex(rgb) {
    if (!rgb) return "#ffff00";
    var match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return "#ffff00";
    return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
}
function hex(x) {
    return ("0" + parseInt(x).toString(16)).slice(-2);
}
function dragStart(e) {
    if (floated) {
        isDown = true;
        if (e.type === 'touchstart') {
            offset = [uiDiv.offsetLeft - e.touches[0].clientX, uiDiv.offsetTop - e.touches[0].clientY];
        } else {
            offset = [uiDiv.offsetLeft - e.clientX, uiDiv.offsetTop - e.clientY];
        }
    }
}
function drag(e) {
    if (isDown) {
        var newX, newY;
        if (e.type === 'touchmove') {
            newX = e.touches[0].clientX + offset[0];
            newY = e.touches[0].clientY + offset[1];
        } else {
            newX = e.clientX + offset[0];
            newY = e.clientY + offset[1];
        }
        var maxX = window.innerWidth - uiDiv.offsetWidth;
        var maxY = window.innerHeight - uiDiv.offsetHeight;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        uiDiv.style.left = newX + 'px';
        uiDiv.style.top = newY + 'px';
    }
}
function dragEnd() {
    isDown = false;
}
