/**
 * Created by vuv on 10/4/2016.
 */
/**
 * Created by vuv on 9/26/2016.
 */
var mediaFileArr = new Array();
var selectedMedia = "";
window.onload = init;
var myvideo = null;
var index = 0;
var mIndex = 1;
var wordsArr = new Array();
var offsetArr = new Array();
var conceptsArr;
var occurrencesArr;
var currentSelectedMedia = "";
var wordElm = null;
var mLanguage = "en-US";
var mContent = "";
var searchWordArr = new Array();
var mPcode = "";
var mReference = "";
var mMediaType = "video/mp4";
var mMediaIndex = 0;
var foundIndex = 0;
function init() {

}
function videoLoaded() {
    $('#loading1').css('display','none');
    $("#videoblock").css('display', 'block');
    /*
     var vheight = myvideo.videoHeight;
     var height = window.screen.height - vheight + 10;
     alert(height);
     var mid = document.getElementById("middle_col");
     mid.style.maxHeight = height+"px";
     */
}
function seekEnded() {
    var pos = myvideo.currentTime * 1000;
    resetReadWords(pos);
    var id = "word" + mIndex;
    wordElm = document.getElementById(id);
}
function seektimeupdate() {
    var pos = myvideo.currentTime * 1000;
    if (!isSyncTranscript) {
        var check = offsetArr[mIndex];
        while (pos > check)
        {
            mIndex++;
            check = offsetArr[mIndex];
        }
        return;
    }
    if (mIndex < offsetArr.length)
    {
        var check = offsetArr[mIndex];
        while (pos > check)
        {
            wordElm.setAttribute("class", "readtext");
            wordElm = document.getElementById("word"+mIndex);
            wordElm.setAttribute("class", "word");
            mIndex++;
            check = offsetArr[mIndex];
        }
    }
}
function resetReadWords(value) {
    var elm;
    for (var i=0; i<mIndex; i++) {
        var idee = "word" + i;
        elm = document.getElementById(idee);
        elm.setAttribute("class", "unreadtext");
    }
    mIndex = 0;
    var pos =  offsetArr[mIndex];
    value = parseInt(value, 10);
    while (pos < value) {
        var idee = "word" + mIndex;
        elm = document.getElementById(idee);
        elm.setAttribute("class", "readtext");
        mIndex++;
        pos =  offsetArr[mIndex];
    }
    if (mIndex == 0)
        mIndex = 1;
}
function jumpTo(timeStamp) {
    var value = timeStamp / 1000;
    myvideo.pause();
    resetReadWords(timeStamp);
    var id = "word" + mIndex;
    wordElm = document.getElementById(id);
    myvideo.play();
    myvideo.currentTime = value;
    /*
    var button = document.getElementById("play");
    button.textContent = "||";
    */
}
function clearText(elm) {
    elm.value = "";
}
function instantSearch() {
    var w = $("#instantsearch").val();
    w = w.toLowerCase().trim();
    while(searchWordArr.length > 0) {
        searchWordArr.pop();
    }
    foundIndex = 0;
    for (var i=0; i<wordsArr.length; i++) {
        var word = wordsArr[i].toLowerCase().trim();
        if (word == w)
            searchWordArr.push(offsetArr[i]);
    }
    if (searchWordArr.length > 0) {
        document.getElementById("nextpanel").style.display = "inline";
        moveNext();
    }
    else {
        var elm = document.getElementById("countword");
        elm.innerHTML = "0/0";
    }

}
function moveNext() {
    var count = searchWordArr.length;
    if (foundIndex >= count)
        foundIndex = 0;
    if (count > 0) {
        var value = searchWordArr[foundIndex];
        myvideo.pause();
        resetReadWords(value);
        var id = "word" + mIndex;
        wordElm = document.getElementById(id);
        myvideo.play();
        value = value / 1000;
        myvideo.currentTime = value;
        foundIndex++;
        $("#countword").html(foundIndex + "/" + count);
        /*
        var button = document.getElementById("play");
        button.textContent = "||";
        */
    }
}
function getMediaListRequest() {
    $('#loading0').css('display','block');
    var parent = document.getElementById("medialist");
    while (parent.lastChild) {
        parent.removeChild(parent.lastChild);
    }

    parent.style.display = "none";
    var sel = document.getElementById("mediatype");
    var type= sel.options[sel.selectedIndex].value;
    var sa = $("#searcharg").val();
    if (sa.length == 0)
        sa = "*";
    //var endpoint = "http://www.hodshowcase.com/rma/engine/richmediaanalytics.php";
    var endpoint = "/getmedialist";
    var query = "search="+sa+"&type="+type;
    $.post(endpoint, query, getMediaListRequestCallback);
}
function getMediaListRequestCallback(data) {
    $('#loading0').css('display','none');
    var parent = document.getElementById("medialist");
    parent.style.display = "block";
    var json = JSON.parse(data);
    while(mediaFileArr.length > 0) {
        mediaFileArr.pop();
    }
    for (var i = 0; i < json.documents.length; i++) {
        //var code = "poweruser";
        //if (json.documents[i].hasOwnProperty('pcode'))
        //    code = json.documents[i].pcode[0];
        mediaFileArr.push({
            ref: json.documents[i].reference,
            type: json.documents[i].mediatype[0],
            filename: json.documents[i].filename[0],
            medianame: json.documents[i].medianame[0],
            mediatype: json.documents[i].mediatype[0]
        });

        var elm = document.createElement("div");
        elm.setAttribute("id", i);
        elm.innerHTML = json.documents[i].medianame[0];
        elm.setAttribute("name", "item");
        elm.setAttribute("class", "item");
        elm.setAttribute("onclick", "setContent('" + i + "')");
        parent.appendChild(elm);
    }
    if (mediaFileArr.length > 0)
        setContent(0);
}
function getContentRequestCallback(data) {
    var json = JSON.parse(data);
    wordsArr = json.documents[0].text;
    offsetArr = json.documents[0].offset;
    mLanguage = json.documents[0].language;
    if (json.documents[0].hasOwnProperty('pcode'))
        mPcode = json.documents[0].pcode;
    mReference = json.documents[0].reference;

    makeSyncTranscript();

    conceptsArr = json.documents[0].concepts;
    occurrencesArr = json.documents[0].occurrences;
    window.setTimeout(playMedia, 500);
    parseConcepts();
    window.setTimeout(getSimilar, 1000);
    //getSimilar();

}
var isSyncTranscript = true;

function makeSyncTranscript() {
    mContent = "";
    var parent = document.getElementById("content");
    while (parent.lastChild) {
        parent.removeChild(parent.lastChild);
    }
    for (var i=0; i<wordsArr.length; i++) {
        var elm = document.createElement("span");
        var idee = "word" + i;
        elm.setAttribute("id", idee);
        elm.setAttribute("class", "unreadtext");
        var w = wordsArr[i];
        if (w != "<Music/Noise>")
            mContent += w + " ";
        var text = document.createTextNode(w + " ");
        elm.appendChild(text);
        elm.setAttribute("onclick", "jumpTo('" + offsetArr[i] + "')");
        parent.appendChild(elm);
    }
}
function deleteContentRequestCallback(resp) {
    //alert(resp);
    //var json = JSON.parse(resp);
    //alert("id" + mMediaIndex);
    /*
     var elm = document.getElementById("id" + mMediaIndex);
     var parent = document.getElementById("medialist");
     parent.removeChild(elm);
     mediaFileArr.splice(mMediaIndex, 1);
     */
    getMediaListRequest();
}
function getConcepts() {
    parseConcepts();
}
function parseConcepts() {
    var concepts = "";
    $('#concepts').css('display','block');
    var extra = document.getElementById("concepts");
    while (extra.lastChild) {
        extra.removeChild(extra.lastChild);
    }

    for (var i=0; i< conceptsArr.length; i++) {
        var concept = conceptsArr[i];
        if (concept.length > 4) {
            var occurrences = occurrencesArr[i];
            if (occurrences >= 3) {
                var elm = document.createElement("div");
                var idee = "concept" + i;
                elm.setAttribute("id", idee);
                if (occurrences > 20)
                    elm.setAttribute("class", "morethan20");
                else if (occurrences > 15)
                    elm.setAttribute("class", "morethan15");
                else if (occurrences > 10)
                    elm.setAttribute("class", "morethan10");
                else if (occurrences > 5)
                    elm.setAttribute("class", "morethan5");
                else if (occurrences >= 3)
                    elm.setAttribute("class", "morethan3");

                var text = document.createTextNode(concept);
                elm.appendChild(text);
                elm.setAttribute("title", "Click to find similar content");
                elm.setAttribute("onclick", "findSimilar('" + concept + "')");
                extra.appendChild(elm);
            }
        }
    }
}
function login() {
  //var endpoint = "http://localhost/login";
  //alert(endpoint);
  //$.get(endpoint, loginRequestCallback);
  var endpoint = "/login";
  var query = "content=test&language=eng";
  $.post(endpoint, query, loginRequestCallback);
}
function loginRequestCallback(resp) {
  alert("call");
}
function loadMessage(){
  var endpoint = "/loadmessages";
  var query = "content=test&language=eng";
  $.post(endpoint, query, loginRequestCallback);
}
function getSimilar() {
    if (mContent.length == 0)
        return;
    $('#relates').html("");
    //$('#relates').css('display','none');
    $('#relatesloading').css('display','block');

    //var endpoint = "http://www.hodshowcase.com/rma/engine/richmediaanalytics.php";
    var endpoint = "/getsimilar";
    var query = "content="+mContent+"&language="+mLanguage;
    $.post(endpoint, query, getSimilarsRequestCallback);
}
function getSimilarsRequestCallback(resp) {
    $('#relatesloading').css('display','none');
    $('#relates').css('display','block');
    var data = JSON.parse(resp);
    var text = "<div style=\"color:gray\">";
    for (var i=0; i< data.documents.length; i++) {
        var doc = data.documents[i];
        text += "<div style=\"color:#01A982 !important\">" + doc.title + "</div>";
        text += "<div><b>Relevance: </b>" + doc.weight + "%</div>";
        if (doc.hasOwnProperty('summary'))
            text += "<div><b>Summary: </b>" + doc.summary + "</div>";
        if (doc.hasOwnProperty('reference'))
        {
            text += "<div><b>Content: </b><a target='_blank' href=\"" + doc.reference + "\">website</a></div>";
        }
        text += "</br>";
    }
    text += "</div>";
    $('#relates').html(text);
    //getInterests();
    window.setTimeout(getInterests, 1000)
}
function switchContentMode(btn) {
    if (isSyncTranscript) {
        btn.firstChild.data = "SYNC TRANSCRIPT";
        isSyncTranscript = false;
        getOpinions();
    } else {
        btn.firstChild.data = "SHOW SENTIMENT";
        makeSyncTranscript();
        mIndex = 0;
        var elm;
        var pos =  offsetArr[mIndex];
        var value = myvideo.currentTime * 1000;
        while (pos < value) {
            var idee = "word" + mIndex;
            elm = document.getElementById(idee);
            elm.setAttribute("class", "readtext");
            mIndex++;
            pos =  offsetArr[mIndex];
        }
        isSyncTranscript = true;
    }

}
function getOpinions() {
    if (mContent.length == 0)
        return;
    $('#content').html("");
    $('#content').css('display','none');
    $('#contentloading').css('display','block');

    //var endpoint = "http://www.hodshowcase.com/rma/engine/richmediaanalytics.php";
    var endpoint = "/getopinions";
    var query = "content="+mContent+"&language="+mLanguage;
    $.post(endpoint, query, getOpinionsRequestCallback);
}
function getOpinionsRequestCallback(resp) {
    $('#contentloading').css('display','none');
    $('#content').css('display','block');
    var data = JSON.parse(resp);
    var text = "<div>";
    var posStatementStartTag = "<span style='color:blue'><b>";
    var posStatementEndTag = "</b></span>";
    var posSentimentStartTag = "<span style='text-decoration:underline'>";
    var posSentimentEndTag = "</span>";

    var negStatementStartTag = "<span style='color:red'><b>";
    var negStatementEndTag = "</b></span>";
    var negSentimentStartTag = "<span style='text-decoration:underline'>";
    var negSentimentEndTag = "</span>";

    var body = mContent;
    if (data.positive.length > 0)
    {
        for  (var i=0; i<data.positive.length; i++)
        {
            var item = data.positive[i];
            body = body.replace(item.original_text, posStatementStartTag + item.original_text + posStatementEndTag);
            if (item.hasOwnProperty('sentiment'))
                body = body.replace(item.sentiment, posSentimentStartTag + item.sentiment + posSentimentEndTag);
        }
    }
    if (data.negative.length > 0)
    {
        for  (var i=0; i<data.negative.length; i++)
        {
            var item = data.negative[i];
            body = body.replace(item.original_text, negStatementStartTag + item.original_text + negStatementEndTag);
            if (item.hasOwnProperty('sentiment'))
                body = body.replace(item.sentiment, negSentimentStartTag + item.sentiment + negSentimentEndTag);
        }
    }
    text += body + "</div>";
    $('#content').html(text);
}
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getInterestsRequestCallback(resp) {
    $('#entitiesloading').css('display','none');
    $('#entities').css('display','block');
    var data = JSON.parse(resp);
    if (data.entities.length > 0)
    {
        var text = "<div>";
        for (var i=0; i< data.entities.length; i++)
        {
            var entity = data.entities[i];
            if (entity.type == "companies_eng")
            {
                text += "<div style=\"color:#01A982 !important\">Companiy name: " + entity.normalized_text + "</div>";
                if (entity.hasOwnProperty('additional_information'))
                {
                    var additional = entity.additional_information;
                    var url = "";
                    if (additional.hasOwnProperty('wikipedia_eng'))
                    {
                        text += "<b>Wiki page: </b><a href=\"";
                        if (additional.wikipedia_eng.indexOf("http") == -1)
                            url = "http://" + additional.wikipedia_eng;
                        else
                            url = additional.wikipedia_eng;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('url_homepage'))
                    {
                        text += "<b>Home page: </b><a href=\"";
                        if (additional.url_homepage.indexOf("http") == -1)
                            url = "http://" + additional.url_homepage;
                        else
                            url = additional.url_homepage;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('company_wikipedia'))
                    {
                        var wikiPage = "";
                        for (var p=0; p < additional.company_wikipedia.length; p++)
                            wikiPage += additional.company_wikipedia[p] + ", ";
                        if (wikiPage.length > 3)
                            wikiPage = wikiPage.substring(0, wikiPage.length - 2);
                        text += "<b>Wikipedia:</b> " + wikiPage + "</br>";
                    }
                    if (additional.hasOwnProperty('company_ric'))
                    {
                        var wikiPage = "";
                        for (var p=0; p<additional.company_ric.length; p++)
                            wikiPage += additional.company_ric[p] + ", ";
                        if (wikiPage.length > 3)
                            wikiPage = wikiPage.substring(0, wikiPage.length - 2);
                        text += "<b>RIC:</b> " + wikiPage + "</br>";
                    }
                }
            }
            else if (entity.type == "places_eng")
            {
                text += "<div style=\"color:#01A982 !important\">Place name: " + entity.normalized_text + "</div>";
                if (entity.hasOwnProperty('additional_information')) {
                    var url = "";
                    var additional = entity.additional_information;
                    if (additional.hasOwnProperty('place_population'))
                    {
                        var pop = parseFloat(additional.place_population, 2);
                        var population = numberWithCommas(pop);// pop.toString();
                        /*
                        if (pop > 1000000)
                        {
                            pop /= 1000000;
                            population = pop.toString() + " million";
                        }
                        */

                        text += "<b>Population:</b> " + population + "</br>";
                    }
                    if (additional.hasOwnProperty('image'))
                    {
                        text += "<img src=\"";
                        text += additional.image + "\" width=\"90%\"/>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('wikipedia_eng'))
                    {
                        text += "<b>Wiki page: </b><a target='_blank' href=\"";
                        if (additional.wikipedia_eng.indexOf("http") == -1)
                            url = "http://";
                        else
                            url = additional.wikipedia_eng;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                    if (additional.lat != 0.0 && additional.lon != 0.0)
                    {
                        var zoom = "10z";
                        if (additional.hasOwnProperty('place_type'))
                        {
                            switch (additional.place_type)
                            {
                                case "region1":
                                    zoom = ",6z";
                                    break;
                                case "continent":
                                    zoom = ",5z";
                                    break;
                                case "area":
                                    zoom = ",7z";
                                    break;
                                case "country":
                                    zoom = ",4z";
                                    break;
                                case "populated place":
                                    zoom = ",10z";
                                    break;
                                default:
                                    zoom = ",12z";
                                    break;
                            }
                        }
                        text += "<b>Map: </b><a target='_blank' href=\"https://www.google.com/maps/@" + additional.lat + "," + additional.lon + zoom + "\">";
                        text += "Show map</a></br>";
                    }
                }
            }
            else if (entity.type == "people_eng")
            {
                text += "<div style=\"color:#01A982 !important\">People name: " + entity.normalized_text + "</div>";

                if (entity.hasOwnProperty('additional_information'))
                {
                    var additional = entity.additional_information;
                    if (additional.hasOwnProperty('person_profession'))
                    {
                        var prof = "";
                        for (var p=0; p < additional.person_profession.length; p++)
                            prof += additional.person_profession[p] + ", ";
                        if (prof.length > 3)
                            prof = prof.substring(0, prof.length - 2);
                        text += "<b>Profession:</b> " + prof + "</br>";
                    }
                    if (additional.hasOwnProperty('person_date_of_birth'))
                        text += "<b>DoB:</b> " + additional.person_date_of_birth + "</br>";
                    if (additional.hasOwnProperty('person_date_of_death'))
                        text += "<b>DoD:</b> " + additional.person_date_of_death + "</br>";
                    if (additional.hasOwnProperty('image'))
                    {
                        text += "<img src=\"";
                        text += additional.image + "\" width=\"90%\"/>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('wikipedia_eng'))
                    {
                        var url = "";
                        text += "<b>Wiki page: </b><a href=\"";
                        if (additional.wikipedia_eng.indexOf("http") == -1)
                            url = "http://";
                        else
                            url = additional.wikipedia_eng;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                }
            }
            else if (entity.type == "drugs_eng")
            {
                text += "<div style=\"color:#01A982 !important\">Drugs: " + entity.original_text + "</div>";
                if (entity.hasOwnProperty('additional_information')) {
                    var additional = entity.additional_information;
                    if (additional.hasOwnProperty('wikipedia_eng')) {
                        var url = "";
                        text += "<b>Wiki page: </b><a href=\"";
                        if (additional.wikipedia_eng.indexOf("http") == -1)
                            url = "http://";
                        else
                            url = additional.wikipedia_eng;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('disease_icd10')) {
                        var temp = "";
                        for (var p = 0; p < additional.disease_icd10.length; p++)
                            temp += additional.disease_icd10[p] + ", ";
                        if (temp.length > 3)
                            temp = temp.substring(0, temp.length - 2);
                        text += "<b>Disease:</b> " + temp + "</br>";
                    }
                }
            } else if (entity.type == "medical_conditions") {
                text += "<div style=\"color:#01A982 !important\">Medical condition: " + entity.original_text + "</div>";
                if (entity.hasOwnProperty('additional_information')) {
                    var additional = entity.additional_information;
                    if (additional.hasOwnProperty('wikipedia_eng')) {
                        var url = "";
                        text += "<b>Wiki page: </b><a target='_blank' href=\"";
                        if (additional.wikipedia_eng.indexOf("http") == -1)
                            url = "http://";
                        else
                            url = additional.wikipedia_eng;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('disease_icd10')) {
                        for (var p = 0; p < additional.disease_icd10.length; p++) {
                            text += "<b>ICD-10: </b><a target='_blank' href=\"";
                            text += additional.disease_icd10[p] + "\">";
                            text += "link</a>";
                            text += "</br>";
                        }
                    }
                }
            }
            text += "<br/>";
        }
        text += "</div>";
        $('#entities').html(text);
    }
}
function findSimilar(concept) {
    //alert(concept);
    $('#relates').html("");
    //$('#relates').css('display','none');
    $('#relatesloading').css('display','block');

    var endpoint = "http://www.hodshowcase.com/rma/engine/richmediaanalytics.php";
    var query = "action=getsimilars&content="+concept+"&language="+mLanguage;
    $.post(endpoint, query, getSimilarsRequestCallback);
}

function getInterests() {
    if (mContent.length == 0)
        return;
    $('#entitiest').html("");
    //$('#entities').css('display','none');
    $('#entitiesloading').css('display','block');

    //var endpoint = "http://www.hodshowcase.com/rma/engine/richmediaanalytics.php";
    var endpoint = "/getinterests";
    var query = "content="+mContent;
    $.post(endpoint, query, getInterestsRequestCallback);
}

var vSource = null;
function playMedia() {
    var bar = document.getElementById("buttonbar");
    bar.style.display = "block";
    var uri = "http://www.hodshowcase.com/media/" + selectedMedia;
    var mp4Vid = document.getElementById('mp4Source');

    mp4Vid.setAttribute('src', uri);
    //mp4Vid.setAttribute('type', mMediaType);

    wordElm = document.getElementById("word0");
    mIndex = 0;
    myvideo.load();
    myvideo.play();
    /*
    var button = document.getElementById("play");
    button.textContent = "||";
    */
}
function setContent(mediaFile) {
    mMediaIndex = mediaFile;

    $('#title').html(mediaFileArr[mediaFile].medianame);
    currentSelectedMedia = mediaFileArr[mediaFile].ref;
    myvideo.pause();
    $('#videoblock').css('display', "none");

    // rest content
    var content = document.getElementById("content");
    while (content.lastChild) {
        content.removeChild(content.lastChild);
    }
    // reset extra content
    var extra = document.getElementById("concepts");
    while (extra.lastChild) {
        extra.removeChild(extra.lastChild);
    }

    $('#loading1').css('display','block');
    var file = mediaFileArr[mediaFile].filename;
    selectedMedia = decodeURI(file);
    mMediaType = mediaFileArr[mediaFile].mediatype;
    readContent(currentSelectedMedia);
}
function deleteMediaRequest() {
    $('#deletedlg').css('display', "block");
}
function deleteMedia() {
    var code = $("#authorcode").val();
    if (code.length == 0) {
        alert("Please enter author code");
        return;
    }
    if (code != mPcode) {
        alert("Unauthorized!");
        return;
    }

    var endpoint = "http://www.hodshowcase.com/rma/engine/richmediaanalytics.php";
    var query = "action=deletecontent&reference=" + mReference;
    $.post(endpoint, query, deleteContentRequestCallback);
    cancelDelete();
}
function cancelDelete() {
    $('#deletedlg').css('display', "none");
}
function readContent(reference) {
    mPcode = "";
    mReference = "";
    $('#concepts').html("");
    $('#relates').html("");
    $('#entities').html("");

    $('#concepts').css('display','none');
    $('#relates').css('display','none');
    $('#entities').css('display','none');

    //var endpoint = "http://www.hodshowcase.com/rma/engine/richmediaanalytics.php";
    var endpoint = "/getcontent";
    var query = "reference=" + reference;
    $.post(endpoint, query, getContentRequestCallback);
}
/*
function vidplay() {
    var button = document.getElementById("play");
    if (myvideo.paused) {
        myvideo.play();
        button.textContent = "||";
    } else {
        myvideo.pause();
        button.textContent = ">";
    }
}
*/
function subscribeContent() {
    window.open("create.html");
}

function test() {
    var testEl = document.createElement( "video" ),
        mpeg4, h264, ogg, webm;
    if ( testEl.canPlayType ) {
        // Check for MPEG-4 support
        mpeg4 = "" !== testEl.canPlayType( 'video/mp4; codecs="mp4v.20.8"' );

        // Check for h264 support
        h264 = "" !== ( testEl.canPlayType( 'video/mp4; codecs="avc1.42E01E"' )
            || testEl.canPlayType( 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' ) );

        // Check for Ogg support
        ogg = "" !== testEl.canPlayType( 'video/ogg; codecs="theora"' );

        // Check for Webm support
        webm = "" !== testEl.canPlayType( 'video/webm; codecs="vp8, vorbis"' );
    }
    var text = "Note: this browser support video formats:\n";
    text += "mpeg4 "
    alert ("Note: this browser support video formats:\n" + mpeg4 + " === " + h264 + " === " + ogg + " === " + webm);
}
