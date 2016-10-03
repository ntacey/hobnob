let sms_user_id = 001;//user.get_user_id(); //will need to change after testing
var displayHtml = "";
var hardCodedContact = '19899641809';//hardcoded contact, will be changed after testing
                                     //TODO: change to look at contacts 

var MessageContext = {
    displayContext : null
}

var userSender = (function(){
    var screenName = user.screen_name;
    
    return screenName === null ? "you" : screenName;
    
})();

function Message(sender, content, displayId) {
    this.messageSender = sender;
    this.messageContent = content;
    this.displayId = displayId; 
    this.displayNumber = (this.displayId * 10) + 3;
}

/*var current_messages = [new Message(userSender,"hi", 4),new Message("contact", "hey", 3), 
                        new Message(userSender,"wsup", 2), new Message("contact", "nm, u?", 1), 
                        new Message(userSender, "nm..", 0)];*/

var current_messages = [];

function loadTexts() {
  //clears the message display
  //makes a call to text service to get recent texts
  //for each message (up to a certain amount?)
  //load each into terminal
  //reconfigure the send button to send 

  clearMessageDisplay();
  MessageContext.displayContext = "SMS";
  syncTexts(function(currMessages){
      addMessages(currMessages);
  });
}

/*
 * This function is used to send ajax requests to server. 
 * httpMethod and server are required, sendDataBool should be false
 * unless sending data through a request like post or put.
 * If sendDataBool is true, should include the data to send in the 
 * next parameter
 * TODO: add response handling ie. if 200 - 300, return ok, etc.
 */
serverCall = function(httpMethod, server, sendDataBool, dataToSend, callback) {
    xhr = new XMLHttpRequest();
    
    if ("withCredentials" in xhr) {
        //xhr.open('GET', 'http://ec2-54-69-82-220.us-west-2.compute.amazonaws.com:8081/texts', true);
        xhr.open(httpMethod.toString(), server.toString(), true);
    } else if (typeof XDomainRequest != "undefined") {
        xhr = new XDomainRequest();
        xhr.open(httpMethod, server);
    } else {
        xhr = null;
    }
        
    xhr.onload = function() {
        var responseText = xhr.responseText;
        console.log(responseText);
        callback(responseText);
    };
    
    if(sendDataBool) {
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        console.log('dataToSend = ' + dataToSend);
        xhr.send(dataToSend);
    } else {
        xhr.send();
        return null;
    }

}
    
syncTexts = function(callback){
    serverCall('GET', 'http://ec2-54-69-93-28.us-west-2.compute.amazonaws.com/texts', false, null, function(responseText){
        let rt = JSON.parse(responseText);
        let currMessages = [];
        
        rt.forEach(function(item, i){
            let msg = new Message(item.sender, item.messageContent, i); 
            currMessages.push(msg);
            current_messages.push(msg);
        });
        
        callback(currMessages);
        console.log("response is " + current_messages);
    });
}

function submitMessage(){
    let messageString = document.getElementById("text-input").value;
    
    if ((messageString != null) && (messageString != '') 
                && (MessageContext.displayContext != null)) {
        
        newMessage(current_messages, messageString);
        document.getElementById("text-input").value = '';
    }
}

/*
 * Add messages in array to message-display div
 * would like to refactor this to not loop twice, possibly store phone in conversation object?
 */
function addMessages(messages) {
    for (let m of messages) {
        let displayPerson = m.messageSender
      
        for (let c of contactList) {
            if (m.messageSender === c.phoneNum) {
                displayPerson = c.name;
            }
        }
      
        if (typeof m.messageContent != "string") {
            console.log("invalid message");
        }
        displayHtml += '<span id="message" style="bottom:' + m.displayNumber + '%;">' +
                     displayPerson + ': ' + m.messageContent + '</span>';
    }
    
    document.getElementById("message-display").innerHTML = displayHtml;
}

function sendMessageToServer(newMessageContent, contact) {
    let method = 'POST';
    let server = 'http://ec2-54-69-93-28.us-west-2.compute.amazonaws.com/texts';
    let sendDataBool = true;
    let dataToSend = "sendTextBool=true&receiver=" + contact + "&messageContent=" + newMessageContent;
    serverCall(method, server, sendDataBool, dataToSend, function(responseText){
        console.log(responseText);
    });
}

function newMessage(messages, newMessageContent) {
    messages.push(new Message(userSender, newMessageContent, -1));
    incrementMessages(messages);
    clearMessageDisplay();
    sendMessageToServer(newMessageContent, hardCodedContact);
    addMessages(messages);
}

function clearMessageDisplay() {
    displayHtml = "";
    document.getElementById("message-display").innerHTML = displayHtml;
}

function incrementMessages(messages) {
    for (let m of messages) {
        m.displayId++;
        m.displayNumber = m.displayNumber + 10;
    }
}

function createCorsRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        xhr.open(method, url, true)
    } else if (typeof XDomainRequest != "undefined") {
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        xhr = null;
    }
    return xhr;
}

function printHi() {
    console.log('hi');
}

function addContact(name, num) {
    let newContact = new Contact();
    newContact.name = name;
    newContact.phoneNum = num;
    contactList.push(newContact);
}

getContacts = function(callback) {
    let method = 'GET';
    let server = '';
    let sdb = false; //send data bool
    let dts = null; //data to send
    serverCall(method, server, sdb, dts, function(responseText) {
        callback(responseText);
    }
}
               
function loadContacts() {
    getContacts(function(contacts) {
        contacts.forEach(function(contact){
            contactList.push(contact);
        }
    }
}

function displayContacts(contactList) {
    
}
        
// load contacts as soon as app is opened
window.onload = function() {
    loadContacts();
}

// key listeners
window.onkeyup = function(e) {
    var key = e.keyCode ? e.keyCode : e.which;
    let messageString = document.getElementById("text-input").value;

    if (key == 13) {
        submitMessage();
    }
    
    if (key == 9) {
        document.getElementById("text-input").focus();
        document.getElementById("text-input").select();                                                                                                         
    }
}
