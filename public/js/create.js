/**
 * Created by vuv on 9/29/2016.
 */
var iterate = 1;
var jobID = "";
var mFileName;
var mLanguage;
var mPcode;
var dots = "...";
function startCreationProcess() {
    var file = document.getElementById("file").files[0];
    if (file == null) {
        alert("Please select a media file.");
        return;
    }
    mFileName = file.name;
    mPcode =  document.getElementById('pcode').value;
    var sel = document.getElementById("language");
    mLanguage = sel.options[sel.selectedIndex].value;
    if (mFileName.length == 0) {
        alert("Please select a media file.");
        return;
    }
    if (mPcode.length == 0) {
        alert("Please enter your author code.");
        return;
    }
    var status = document.getElementById("progress");
    status.innerHTML = "Uploading file ...";
    $('#processing').css('display','block');
    document.getElementById("submitbtn").disabled = true;

    window.setTimeout(uploadFileRequest, 1000);
}

function uploadFileRequest() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var data = xhr.responseText;
            if (data == "upok" || data == "existed")
                window.setTimeout(subscribeContentRequest(), 1000);
        }
    }
    var formData = new FormData();
    formData.append("file", document.getElementById("file").files[0]);
    xhr.open("POST", "http://www.hodshowcase.com/media/uploadmedia.php", false);
    xhr.send(formData);
    document.getElementById("file").value = "";
    event.preventDefault();
    return false;
}

function subscribeContentRequest() {
    var status = document.getElementById("progress");
    status.innerHTML = "Extracting text from speech. Please wait " + dots;
    var endpoint = "http://www.hodshowcase.com/rma/engine/subscribemedia.php";
    var query = "action=recognize";
    query += "&filename="+mFileName;
    query += "&language="+mLanguage;
    $.post(endpoint, query, sendGetResultRequest);
}

function sendGetResultRequest(data) {
    var json = JSON.parse(data);
    if (json.status == "inprogress") {
        var status = document.getElementById("progress");
        dots += ".";
        status.innerHTML = "Extracting text from speech. Please wait " + dots;
        if (dots.length > 50)
            dots = "...";
        jobID = json.jobID;
        window.setTimeout(getResultRequest, 10000);
    }
    else if (json.status == "done") {
        window.setTimeout(createComplete, 500);
    } else {
        document.getElementById("submitbtn").disabled = false;
        var status = document.getElementById("progress");
        status.innerHTML = "Content subscription failed. Please try again.";
    }
}
function getResultRequest() {
    var endpoint = "http://www.hodshowcase.com/rma/engine/subscribemedia.php";
    var query = "action=getstatus&jobid="+jobID;
    query += "&filename="+mFileName;
    query += "&pcode="+mPcode;
    query += "&language="+mLanguage;
    $.post(endpoint, query, sendGetResultRequest);
}
function createComplete() {
    $('#processing').css('display','none');
    document.getElementById("submitbtn").disabled = false;
    var status = document.getElementById("progress");
    status.innerHTML = "Your content subscription completed successfully.<br/>Reload the Media list from the Rich Media Analytics to see the new content.";
}
