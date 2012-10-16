var express = require('express');
var app = express();

app.configure(function() {
    app.set('port', 8000);
    app.use(express.static(__dirname + '/public'));
    app.use(express.logger());
});

app.get('/', function(req, res) {
    res.sendfile('public/index.html');
});

app.listen(app.get('port'));
console.log("Listening on port " + app.get('port'));