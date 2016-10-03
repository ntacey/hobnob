var http = require('http');
var qs = require('querystring');

let port = 80;

http.createServer(function(req, res){
    if (req.method === 'GET') {
        if (req.url === '/' || req.url === '/contacts') {
            
        }
    } 
}).listen(port);

console.log('server running on port ' + port);