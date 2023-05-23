var matches;
var position;
const maxSearch = 10;
var searchCounter = 0;
addSearch(document.getElementById('toolbar'), document.getElementById('conversation-display'));
var searchedDiv;
//ideal 10 highlight color list
var idealcolor = ["#ffff00", "#ff00ff", "#00ffff", "#ff0000", "#00ff00", "#0000ff", "#ff8000", "#ff0080", "#80ff00", "#8000ff"];
function addSearch(uiDiv, targetDiv) {
    searchedDiv = targetDiv;
    //create the search tool
    const searchTool = document.createElement('div');
    searchTool.setAttribute('id', 'searchTool');
    searchTool.style.display = 'block';
    uiDiv.appendChild(searchTool);
    //create the search tool button
    const searchToolButton = document.createElement('button');
    searchToolButton.setAttribute('id', 'searchToolButton');
    searchToolButton.innerHTML = 'Search';
    searchToolButton.addEventListener('click', function () {
        searchList.style.display = 'block';
        searchbar.style.display = 'flex';
        this.style.display = 'none';
    });
    searchTool.appendChild(searchToolButton);
    //create the search list it list all the searchs done
    const searchList = document.createElement('div');
    searchList.setAttribute('id', 'searchList');
    searchList.style.display = 'none';
    searchTool.appendChild(searchList);
    //create the search bar it contains the input, highlight color, case sensitive, search button
    const searchbar = document.createElement('div');
    searchbar.setAttribute('id', 'searchbar');
    searchbar.style.display = 'none';
    searchTool.appendChild(searchbar);
    //create the search input
    const searchInput = document.createElement('input');
    searchInput.style.backgroundColor = window.matchMedia('(prefers-color-scheme: dark)').matches ? "#000000" : "#ffffff";
    searchInput.style.color = searchInput.style.backgroundColor === "#ffffff" ? "#000000" : "#ffffff";
    searchInput.setAttribute('type', 'text');
    searchInput.setAttribute('id', 'searchInput');
    searchInput.setAttribute('placeholder', 'Search');
    searchInput.addEventListener('keyup', function (e) {
        if (e.key === "Enter") {
            searchButton.click();
        }
    });
    searchbar.appendChild(searchInput);
    //create the highlight color picker
    const highlight = document.createElement('input');
    highlight.setAttribute('id', 'highlight');
    highlight.setAttribute('type', 'color');
    highlight.setAttribute('value', '#ffff00');
    highlight.style.backgroundColor = '#ffff00';
    highlight.style.width = '1em';
    highlight.style.margin = '8px';
    highlight.addEventListener('input', function () {
        this.style.backgroundColor = this.value;
    });
    searchbar.appendChild(highlight);
    //create the case sensitive checkbox
    const caseSensitive = document.createElement('input');
    caseSensitive.setAttribute('id', 'caseSensitive');
    caseSensitive.setAttribute('type', 'checkbox');
    caseSensitive.setAttribute('value', 'caseSensitive');
    searchbar.appendChild(caseSensitive);
    const caseSensitiveLabel = document.createElement('label');
    caseSensitiveLabel.setAttribute('for', 'caseSensitive');
    caseSensitiveLabel.innerHTML = 'Case Sensitive';
    searchbar.appendChild(caseSensitiveLabel);
    //create the search button
    const searchButton = document.createElement('button');
    searchButton.setAttribute('id', 'searchButton');
    searchButton.innerHTML = 'Search';
    searchButton.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        test();
    });
    searchButton.addEventListener('click', function () {
        if (searchCounter < maxSearch) {
            var tagName = 'searchListItem' + (searchCounter + 1);
            highlight.value = highlight.value !="#000000"? highlight.value : idealcolor[searchCounter % 10];
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
                highlight.value = idealcolor[searchCounter % 10];
                highlight.style.backgroundColor = highlight.value;
            } else {
                alert('No matches found');
            }
        } else {
            alert('You have reached the maximum number of searchs');
        }
    });
    searchbar.appendChild(searchButton);
    //create the next and previous buttons
    // const nextButton = document.createElement('button');
    // nextButton.setAttribute('id', 'nextButton');
    // nextButton.style.display = 'none';
    // nextButton.innerHTML = 'Next';
    // nextButton.setAttribute('onclick', 'nextSearch()');
    // searchbar.appendChild(nextButton);
    // const previousButton = document.createElement('button');
    // previousButton.setAttribute('id', 'previousButton');
    // previousButton.style.display = 'none';
    // previousButton.innerHTML = 'Previous';
    // previousButton.setAttribute('onclick', 'previousSearch()');
    // searchbar.appendChild(previousButton);
    //create the clear button
    const clearSearch = document.createElement('button');
    clearSearch.setAttribute('id', 'clearSearch');
    searchbar.appendChild(clearSearch);
    clearSearch.innerHTML = 'Clear';
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
        //un highlight all the text done by all searchs
    });
    //create the close button
    const closeButton = document.createElement('button');
    closeButton.setAttribute('id', 'closeButton');
    searchbar.appendChild(closeButton);
    closeButton.innerHTML = 'Close';
    closeButton.addEventListener('click', function () {
        searchList.style.display = 'none';
        searchbar.style.display = 'none';
        searchToolButton.style.display = 'block';
    });
}
//modify the search list
function modifySearch(element) {

    unhighlightText(element.getAttribute('id'));
    searchInput.value = element.innerHTML;
    searchCounter--;
    highlight.value = element.style.backgroundColor!="#000000" ? element.style.backgroundColor : idealcolor[searchCounter % 10];
    highlight.style.backgroundColor = highlight.value;
    element.remove();
    //un highlight all the text done by this search
    //need code
    nextButton.style.display = 'none';
    previousButton.style.display = 'none';
}
//var highlightItems = {};
function highlightText(tagName, searchText, color) {
    var toBeSearched = searchedDiv.innerHTML.toString();
    var pureText = searchedDiv.textContent;
    matches = pureText.match(new RegExp(searchText, (caseSensitive.checked ? "g" : "gi")));
    // If there are no matches, return.
    if (!matches) {
        return false;
    }
    // Highlight all the matching text.
    var lastEnd = 0;
    //clear highlightItems
 //   highlightItems = {};
// //test text position
//     var range = document.createRange();
//     range.selectNode(div);
//     var textNode;
// //test text position
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
            var end = start + match.length;
            toBeSearched = toBeSearched.slice(0, start) + span.outerHTML + toBeSearched.slice(end);
            lastEnd = start + span.outerHTML.length;

// //test text position
//             var rect = textNode.getBoundingClientRect();
//             var x = rect.left - div.offsetLeft;
//             var y = rect.top - div.offsetTop;
//     //test text position        
            
//             highlightItems.newItem = { start: start, text: match,end:lastEnd, x:x,y: y};
        }


    }
    searchedDiv.innerHTML = toBeSearched;
    // Scroll to the first matching result.
    const firstMatch = matches[0];
    position = firstMatch.offsetTop;
    const firstMatchOffset = searchedDiv.offsetTop + firstMatch.offsetTop;
    window.scrollTo(0, firstMatchOffset);
    searchedDiv.scrollTop = position;
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
// function nextSearch() {
//     // Scroll to the next matching result.
//     for (var i = 0; i < matches.length; i++) {
//         if (matches[i].offsetTop > position) {
//             position = matches[i].offsetTop;
//             const MatchOffset = searchedDiv.offsetTop + firstMatch.offsetTop;
//             window.scrollTo(0, MatchOffset);
//             searchedDiv.scrollTop = position;
//             return;
//         }
//     }
//     // If no more matches, scroll to the first match.
//     position = matches[0].offsetTop;
//     const MatchOffset = searchedDiv.offsetTop + firstMatch.offsetTop;
//     window.scrollTo(0, MatchOffset);
//     searchedDiv.scrollTop = position;
// }
// function previousSearch() {
//     // Scroll to the previous matching result.
//     for (var i = matches.length - 1; i >= 0; i--) {
//         if (matches[i].offsetTop < position) {
//             position = matches[i].offsetTop;
//             const MatchOffset = searchedDiv.offsetTop + firstMatch.offsetTop;
//             window.scrollTo(0, MatchOffset);
//             searchedDiv.scrollTop = position;
//             return;
//         }
//     }
//     // If no more matches, scroll to the last match.
//     position = matches[matches.length - 1].offsetTop;
//     const MatchOffset = searchedDiv.offsetTop + firstMatch.offsetTop;
//     window.scrollTo(0, MatchOffset);
//     searchedDiv.scrollTop = position;
// }

function test() {
    searchedDiv.innerHTML = "<div>Test:<p class = 'botText'>Testing is a crucial part of any software development lifecycle. It ensures that the software meets the required quality standards, is reliable, and performs as expected. Testing is the process of evaluating a system or its component(s) with the intent to find whether it satisfies the specified requirements or not. It is essential to identify and fix any defects in the software before it is released to the end-users. There are different types of testing that can be performed on software, such as functional testing, performance testing, security testing, usability testing, and many more. Each type of testing focuses on a specific aspect of the software and helps to ensure that it meets the required criteria. Functional testing is a type of testing that focuses on verifying whether the software functions as expected. It includes various types of testing such as unit testing, integration testing, system testing, and acceptance testing. Performance testing is another type of testing that focuses on evaluating the performance of the software, such as load testing and stress testing. Security testing is a type of testing that focuses on identifying and fixing security vulnerabilities in the software. Usability testing, on the other hand, focuses on evaluating the ease of use of the software. Testing can be performed manually or using automated tools. Manual testing involves a tester manually testing the software, while automated testing involves using automated tools to perform the tests. Automated testing is faster, more efficient, and can be performed repeatedly, making it ideal for regression testing. In conclusion, testing is an essential part of the software development lifecycle. It ensures that the software meets the required quality standards and performs as expected. Different types of testing can be performed on software, such as functional testing, performance testing, security testing, usability testing, and many more. Testing can be performed manually or using automated tools, with automated testing being faster and more efficient.</p></div>"
}

