/*
 * Creates a new text message, sends it through Twilio's API and then saves it to 
 * dynamoDB
 */
var twilio = require('twilio');
var context = require('../context');
var AWS = require("aws-sdk");
var MessageModel = require("../models/textMessage.js");

var exports = module.exports = {};
var isPaused = true;
var messageUpdated;

function createMessage(inputTextMessage) {
    var client = new twilio.RestClient(context.twilio_data.accountSid, context.twilio_data.authToken);
    
    client.sms.messages.create({

        to: inputTextMessage.receiver,
        from: inputTextMessage.sender,
        body: inputTextMessage.messageContent },
        
        function(error, message) {
            messageUpdated = inputTextMessage;
        
            if (!error) {
                const unixtime = Date.parse(message.dateCreated)/1000;
                
                console.log('Success! The SID for this SMS message is: ' + message.sid);
                messageUpdated.sid = message.sid;
                
                console.log('Message sent on:' + message.dateCreated);
                console.log(message.dateCreated);
                messageUpdated.timestamp = unixtime;
                
                var isPaused=true;
                return messageUpdated;
            } else {
                console.error('Error creating message: ' + error.message);
                return null;
            }
    });
};

var saveMessage = function(textMessage) {
    AWS.config.update({
        region: context.aws_data.region,
        endpoint: context.aws_data.end_point
    });
    
    var docClient = new AWS.DynamoDB.DocumentClient();
    
    var params = {
        TableName: "texts3",
        Item: {
            "sid" : textMessage.sid,
            "timestamp" : textMessage.timestamp,
            "sender" : textMessage.sender.toString(),
            "receiver" : textMessage.receiver.toString(),
            "messageContent" : textMessage.messageContent,
            "convo" : 1
        }
    }
    
    console.log('attempting to add new text to dynamo..');
    
    docClient.put(params, function(err, data) {
        if(err) {
            console.error("Error loading message to database: " + JSON.stringify(err, null, 2));
        } else {
            console.log("Message successfully loaded into database");
        }
        
    });
}

var sendMessage = function(receiver, messageContent){
    const textMessage = new MessageModel.textMessage(receiver, context.twilio_data.accPhoneNum, messageContent);
    
    //const updatedMessage = createMessage(textMessage); 
    createMessage(textMessage);
    
    // need to refactor to Promises down the road.. current code can cause bugs
    // if the timeout completes before the return of createMessage()
    function waitForIt(){
        if (typeof messageUpdated === 'undefined' ) {
            setTimeout(function(){waitForIt()},100);
            console.log('waiting..');
        } else if (messageUpdated.timestamp === 'undefined') {
            setTimeout(function(){waitForIt()},100);
            console.log('waiting..');
        } else {
            if (messageUpdated != null || typeof messageUpdated != 'undefined') {
                console.log('message saved');
                return saveMessage(messageUpdated);
            } else {
                console.error('messageUpdated was bad');
                return null;
            } 
        };
    }
    
    waitForIt();
};

//TODO: refactor to look by specific phone number, either in receiver or sender
    //also might split this out into its own js file.
var queryMessages = function(callback){
    let date = new Date();
    date.setMonth(date.getMonth() - 1); //one month ago from today, which means 
                                        //we're only returning texts from this month
    const unixtime = date.getTime()/1000;
    let messageArr = [];
    
    AWS.config.update({
        region: context.aws_data.region,
        endpoint: context.aws_data.end_point
    });
    
    let docClient = new AWS.DynamoDB.DocumentClient();

    let params = {
	   TableName: "texts3",
	   //IndexName: "sid-timestamp-index",
	   ProjectionExpression: "messageContent, sender, receiver",
       KeyConditionExpression: "#convo = :v_convo AND #timestamp > :v_timestamp", 
       ExpressionAttributeNames: {
           "#convo": "convo",
           "#timestamp": "timestamp"
       },
       ExpressionAttributeValues: {
           ":v_convo": 1,
           ":v_timestamp": unixtime //one month from today
       },
	   Limit: 10,
	   ScanIndexForward: "false"
    }
    
    console.log('attempting to query list of messages from database');
    
    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            return null;
        } else {
            console.log("Query succeeded.");
            data.Items.forEach(function(item) {
                let msg = new MessageModel.textMessage(item.receiver, item.sender, item.messageContent);
                msg.convo = item.convo;
                msg.timestamp = item.timestamp;
                msg.sid = item.sid;
                messageArr.push(msg);
            });
            callback(messageArr);
        }
    });
}

module.exports = {
    sendMessage,
    saveMessage,
    queryMessages
}