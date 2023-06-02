var matches;
var position;
const maxSearch = 10;
var searchCounter = 0;
addSearch(document.getElementById('toolbar'), document.getElementById('conversation-display'));
var searchedDiv;
var uiDiv;
var mousePosition;
var offset = [0, 0];
var isDown = false;
var floated = false;
//ideal 10 highlight color list
var idealcolor = ["#ffff00", "#ff00ff", "#00ffff", "#ff0000", "#00ff00", "#0000ff", "#ff8000", "#ff0080", "#80ff00", "#8000ff"];
function addSearch(toolDiv, targetDiv) {
    var backgroundColor = window.matchMedia('(prefers-color-scheme: dark)').matches ? "#000000" : "#ffffff";
    searchedDiv = targetDiv;
    uiDiv = toolDiv
    //create the search tool
    const searchTool = document.createElement('div');
    searchTool.setAttribute('id', 'searchTool');
    searchTool.style.display = 'block';
    uiDiv.style.backgroundColor = backgroundColor + "88";
    uiDiv.style.borderRadius = '4px';
    uiDiv.appendChild(searchTool);
    var parentDiv = document.getElementById('parentDiv');
    var originalPosition;
    originalPosition = {
        x: uiDiv.offsetLeft - parentDiv.offsetLeft,
        y: uiDiv.offsetTop - parentDiv.offsetTop
    };
    //create the search tool button
    const searchToolButton = document.createElement('button');
    searchToolButton.setAttribute('id', 'searchToolButton');
    searchToolButton.innerHTML = '<img src="search.png" title = "search" style="height:1em;"/>';
    searchToolButton.addEventListener('click', function () {
        //sth is wrong
        //searchList.style.display = searchList.style.display == 'flex'?'none':'flex';
        searchbar.style.display = searchbar.style.display == 'flex' ? 'none' : 'flex';
        uiDiv.style.position = searchbar.style.display == 'flex' ? 'fixed' : 'relative';
        //add box-shadow: rgba(0, 0, 0, 0.5) 0.3em 0.3em 0.3em; to uiDiv.style
        uiDiv.style.boxShadow = searchbar.style.display == 'flex' ? 'rgba(0, 0, 0, 0.5) 0.3em 0.3em 0.3em' : 'none';
        //set innerHTML to "X" when fixed
        this.innerHTML = searchbar.style.display == 'flex' ? '<img src="close.png" title = "close" style="height:1em;"/>' : '<img src="search.png" title="search" style="height:1em;"/>';
        if (searchbar.style.display == 'flex') {
            uiDiv.style.left = parentDiv.offsetLeft + 'px';
            uiDiv.style.top = parentDiv.offsetTop + 'px';

            floated = true;
        } else {
            uiDiv.style.left = originalPosition.x + 'px';
            uiDiv.style.top = originalPosition.y + 'px';
            floated = false;
        }
    });
    // searchTool.appendChild(searchToolButton);    
    //create the search list it list all the searchs done
    const searchList = document.createElement('div');
    searchList.setAttribute('id', 'searchList');
    searchList.style.display = 'flex';
    searchTool.appendChild(searchList);
    searchList.appendChild(searchToolButton);

    //create the search bar it contains the input, highlight color, case sensitive, search button
    const searchbar = document.createElement('div');
    searchbar.setAttribute('id', 'searchbar');
    searchbar.style.display = 'none';
    searchTool.appendChild(searchbar);
    searchbar.style.flexWrap = 'wrap';
    searchbar.style.justifyContent = 'flex-start';
    searchbar.style.alignItems = 'center';
    //create the search input
    const searchInput = document.createElement('input');
    searchInput.style.backgroundColor = backgroundColor;
    searchInput.style.color = searchInput.style.backgroundColor === "#ffffff" ? "#000000" : "#ffffff";
    searchInput.setAttribute('type', 'text');
    searchInput.setAttribute('id', 'searchInput');
    searchInput.setAttribute('placeholder', 'Search');
    searchInput.style.width = 'fit-content';
    searchInput.addEventListener('keyup', function (e) {
        if (e.key === "Enter") {
            searchButton.click();
        }
    });
    //create the highlight color picker
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
    //create the case sensitive checkbox
    const caseSensitive = document.createElement('input');
    caseSensitive.setAttribute('id', 'caseSensitive');
    caseSensitive.setAttribute('type', 'checkbox');
    caseSensitive.setAttribute('value', 'caseSensitive');
    caseSensitive.style.display = 'none';
    caseSensitive.addEventListener('change', function () {
        if (this.checked) {
            caseSensitiveLabel.style.color = '#ff0000';
        } else {
            caseSensitiveLabel.style.color = '#888888';
        }
    });
    const caseSensitiveLabel = document.createElement('label');
    caseSensitiveLabel.setAttribute('for', 'caseSensitive');
    caseSensitiveLabel.innerHTML = 'Aa';
    caseSensitiveLabel.style.margin = '8px';
    caseSensitiveLabel.style.color = '#888888';
    //create the match whole word checkbox
    const matchWholeWord = document.createElement('input');
    matchWholeWord.setAttribute('id', 'matchWholeWord');
    matchWholeWord.setAttribute('type', 'checkbox');
    matchWholeWord.setAttribute('value', 'matchWholeWord');
    matchWholeWord.style.display = 'none';
    matchWholeWord.addEventListener('change', function () {
        if (this.checked) {
            matchWholeWordLabel.style.color = '#ff0000';
        } else {
            matchWholeWordLabel.style.color = '#888888';
        }
    });
    const matchWholeWordLabel = document.createElement('label');
    matchWholeWordLabel.setAttribute('for', 'matchWholeWord');
    matchWholeWordLabel.innerHTML = '〔ab〕';
    matchWholeWordLabel.style.color = '#888888';
    matchWholeWordLabel.style.margin = '8px 0px';
    //create the search button
    const searchButton = document.createElement('button');
    searchButton.setAttribute('id', 'searchButton');
    searchButton.innerHTML = '✔';
    searchButton.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        test();
    });
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
                //search the input in the display and highlight it
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
    //create the next and previous buttons
    const nextButton = document.createElement('button');
    nextButton.setAttribute('id', 'nextButton');
    nextButton.style.display = 'none';
    nextButton.innerHTML = '▶';
    nextButton.setAttribute('onclick', 'nextSearch()');
    const previousButton = document.createElement('button');
    previousButton.setAttribute('id', 'previousButton');
    previousButton.style.display = 'none';
    previousButton.innerHTML = '◀';
    previousButton.setAttribute('onclick', 'previousSearch()');

    //create the clear button
    const clearSearch = document.createElement('button');
    clearSearch.setAttribute('id', 'clearSearch');
    clearSearch.innerHTML = '✘';
    clearSearch.style.display = 'none';
    clearSearch.addEventListener('click', function () {
        // Get all the spans in the div.
        const spans = searchedDiv.querySelectorAll("span");
        // Remove all the spans.
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
        //un highlight all the text done by all searchs
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
    //move uiDIV with mouse or touch
    uiDiv.addEventListener('mousedown', dragStart);
    uiDiv.addEventListener('touchstart', dragStart, { passive: true });
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: true });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);

}
//modify the search list
function modifySearch(element) {
    unhighlightText(element.getAttribute('id'));
    searchInput.value = element.innerHTML;
    searchCounter--;
    var color = rgbtohex(element.style.backgroundColor);
    highlight.value = color != "#000000" ? color : idealcolor[searchCounter % 10];
    highlight.style.backgroundColor = highlight.value;
    element.remove();
    //un highlight all the text done by this search
    //need code
    nextButton.style.display = 'none';
    previousButton.style.display = 'none';
    if (searchCounter == 0) {
        clearSearch.style.display = 'none';
    }
}
var highlightItems = [];
var showPoint = 0;
function highlightText(tagName, searchText, color) {
    var toBeSearched = searchedDiv.innerHTML.toString();
    var pureText = searchedDiv.textContent;
    searchText = matchWholeWord.checked ? '\\b' + searchText + '\\b' : searchText;
    matches = pureText.match(new RegExp(searchText, (caseSensitive.checked ? "g" : "gi")));
    // If there are no matches, return.
    if (!matches) {
        return false;
    }
    // Highlight all the matching text.
    var lastEnd = 0;
    //clear highlightItems
    highlightItems = [];
    //test text position
    var range = document.createRange();
    range.selectNode(searchedDiv);
    var textNode;
    //test text position
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
        }
        highlightItems.push({ start: start, text: match, end: lastEnd });
    }
    searchedDiv.innerHTML = toBeSearched;
    // Scroll to the first matching result.
    searchedDiv.focus();
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(createRangeFromPosition(highlightItems[0]));
    document.getElementById('highlight' + highlightItems[0].start).scrollIntoView();
    return true;
}
//function to check if the position in inside a tag
function insideTag(text, position) {
    return text.lastIndexOf("<", position) > text.lastIndexOf(">", position);
}
function unhighlightText(tagName) {
    const spans = searchedDiv.querySelectorAll("span");
    // Remove all the spans that have the specified color.
    for (const span of spans) {
        if (span.className == tagName) {
            span.outerHTML = span.innerHTML;
        }
    }
}
function nextSearch() {
    // Scroll to the next matching result.
    searchedDiv.focus();
    showPoint = (showPoint + 1) % highlightItems.length;
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(createRangeFromPosition(highlightItems[showPoint]));
    document.getElementById('highlight' + highlightItems[showPoint].start).scrollIntoView();
}
function previousSearch() {
    // Scroll to the previous matching result.
    searchedDiv.focus();
    showPoint = (highlightItems.length + showPoint - 1) % highlightItems.length;
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(createRangeFromPosition(highlightItems[showPoint]));
    document.getElementById('highlight' + highlightItems[showPoint].start).scrollIntoView();
}

function test() {
    searchedDiv.innerHTML = "<div>Test:<p class = 'botText'>Testing is a crucial part of any software development lifecycle. It ensures that the software meets the required quality standards, is reliable, and performs as expected. Testing is the process of evaluating a system or its component(s) with the intent to find whether it satisfies the specified requirements or not. It is essential to identify and fix any defects in the software before it is released to the end-users. There are different types of testing that can be performed on software, such as functional testing, performance testing, security testing, usability testing, and many more. Each type of testing focuses on a specific aspect of the software and helps to ensure that it meets the required criteria. Functional testing is a type of testing that focuses on verifying whether the software functions as expected. It includes various types of testing such as unit testing, integration testing, system testing, and acceptance testing. Performance testing is another type of testing that focuses on evaluating the performance of the software, such as load testing and stress testing. Security testing is a type of testing that focuses on identifying and fixing security vulnerabilities in the software. Usability testing, on the other hand, focuses on evaluating the ease of use of the software. Testing can be performed manually or using automated tools. Manual testing involves a tester manually testing the software, while automated testing involves using automated tools to perform the tests. Automated testing is faster, more efficient, and can be performed repeatedly, making it ideal for regression testing. In conclusion, testing is an essential part of the software development lifecycle. It ensures that the software meets the required quality standards and performs as expected. Different types of testing can be performed on software, such as functional testing, performance testing, security testing, usability testing, and many more. Testing can be performed manually or using automated tools, with automated testing being faster and more efficient.</p></div>"
    searchInput.value = "test";
    searchButton.click();

}

function createRangeFromPosition(hl) {
    // Create a new Range object
    let range = document.createRange();
    // Split the text content of the element into two TextNode objects
    let textNode = document.getElementById("highlight" + hl.start).firstChild;
    range.setStart(textNode, 0);
    range.setEnd(textNode, hl.text.length);
    return range;
}
function rgbtohex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}
function hex(x) {
    return ("0" + parseInt(x).toString(16)).slice(-2);
}
function dragStart(e) {
    if (floated) {
        isDown = true;
        if (e.type === 'touchstart') {
            offset = [
                uiDiv.offsetLeft - e.touches[0].clientX,
                uiDiv.offsetTop - e.touches[0].clientY
            ];
        } else {
            offset = [
                uiDiv.offsetLeft - e.clientX,
                uiDiv.offsetTop - e.clientY
            ];
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