var http = require('http');
var sendText = require('./services/sendText.js');
var MessageModel = require('./models/textMessage.js');
var qs = require('querystring');
const spawn = require('child_process').spawn;

var port = 80;

http.createServer(function(req, res){
    if (req.method === 'POST') {
        if (req.url === '/texts') {
            var body = '';
            var postData;
            var finished = true;
            
            req.on('data', function(data) {
                body += data;
            });
            
            req.on('end', function() {
                postData = qs.parse(body);
                
                if (postData === undefined || (postData['receiver'] === undefined || postData['receiver'] === ''
                    || postData['receiver'] === null) || (postData['messageContent'] === undefined 
                    || postData['messageContent'] === '' || postData['messageContent'] === null)) {
                    
                    finished = false;
                    
                } else {
                    var receiver = postData['receiver'];
                    var messageContent = postData['messageContent'];
                    
                    //TODO: add check for size of messageContents. it must be 160 chars or less

                    //console.log('receiver: ' + receiver);
                    //console.log('messageContent: ' + messageContent);
                    //console.log('postData: ' + postData)
                    sendText.sendMessage(receiver, messageContent);
                }
                
                if (!finished) {
                    res.writeHead(404, {'Content-Type': 'text/html'});
                    res.write('Error empty data. Required: receiver and messageContent');
                    res.end();
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write('thanks for the data yo');
                    res.end();
                    console.log('posted');
                }
            });
            
        } else if (req.url === '/receivetexts') {
            let body = '';
            let postData;
            let finished = true;
            
            req.on('data', function(data) {
                body += data;
            });
            
            req.on('end', function() {
                postData = qs.parse(body);
                
                let d = new Date();
                const unixtime = d.getTime()/1000;
                
                let receiver = postData['To'];
                let messageContent = postData['Body'];
                let sender = postData['From'];
                let timestamp = unixtime;
                let convo = 1; //hardcoded, needs to be changed later
                let sid = postData['MessageSid'];
                
                let textMessage = new MessageModel.textMessage(receiver, sender, messageContent);
                textMessage.sid = sid;
                textMessage.timestamp = timestamp;
                textMessage.convo = convo;
                
                sendText.saveMessage(textMessage);
                
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write('thanks for the data yo');
                res.end();
                console.log('posted');
            });
        } else if (req.url === '/server') {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('initializing build script');
            res.end();
            console.log('calling build script');
            spawn('sh', [ 'build.sh' ]);
        } else {
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end();
        }
    } else if (req.method === 'GET') {
        if (req.url === '/texts') {
            sendText.queryMessages(function(messageArr) {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(JSON.stringify(messageArr));
                /*
                messageArr.forEach(function(item) {
                    res.write(JSON.stringify(item));
                });
                */
                res.end();
            });
        } else {
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end();
        }
    } else {
        res.writeHead(405, 'Method Not Supported', {'Content-Type': 'text/html'});
	    res.end();
    }
}).listen(port);

console.log('starting server on port ' + port);