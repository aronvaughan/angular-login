var application_root = __dirname,
    express = require("express"),
    path = require("path"),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser');

var app = express();
app.use(bodyParser());
app.use(cookieParser());

var loggedIn = false;
var userName = "admin";
var passWord = "admin";
var adminUser = {
    userName: userName,
    name: "Admin User"
};
var currentUser = {};

/**
 * get all the names registered
 */
app.get('/api/userInfo', function(req, res) {
    console.log("get userInfo, returning: ", currentUser, loggedIn);
    res.send(JSON.stringify(currentUser));
});

/**
 * login
 */
app.post('/api/login', function(req, res) {
    var body = req.body;

    console.log('SERVER logging in : ' + body, req.get('Content-Type')); //JSON.stringify(body)

    var passesAuth = false;
    if (req.get('Content-Type').indexOf('application/x-www-form-urlencoded') > -1 && userName === body.username && passWord === body.password) {
        passesAuth = true;
    } else if (req.get('Content-Type').indexOf('application/json') > -1 && (userName === body.username && passWord === body.password)) {
        passesAuth = true;
    }

    if (passesAuth) {
        console.log('SERVER - login success');
        loggedIn = true;
        currentUser = adminUser;
        //for spring rest security
        res.set({
            'X-Auth-Token': 'fakeToken'
        });
        currentUser.token = 'fakeToken';
        //for spring based security
        res.cookie('JSESSIONID', 'fakeToken');
        res.send(JSON.stringify(currentUser));
    } else {
        console.log('SERVER - login error');
        res.status(401).send("error!");
    }
});

app.get('/api/protectedCall', function(req, res) {
    console.log('SERVER - protected call, called');
    var headerValue = req.get('X-Auth-Token');
    var cookieValue = req.cookies.JSESSIONID;
    if (headerValue !== "fakeToken" && cookieValue !== 'fakeToken') {
        console.log('SERVER - protected call error!', headerValue, cookieValue);
        res.status(403).send({
            'error': 'no token found!'
        });
    } else {
        console.log('SERVER - protected call success!', headerValue);
        res.set({
            'X-Auth-Token': 'fakeToken'
        });
        res.cookie('JSESSIONID', 'fakeToken');
        res.send({
            'value1': 'good'
        });
    }
});

/**
 * logout
 */
app.post('/api/logout', function(req, res) {
    console.log('SERVER logging out ');
    loggedIn = false;
    currentUser = {};
    res.clearCookie('JSESSIONID');
    res.send(JSON.stringify("{messsage: successfully logged out}"));

});

/**
 * startup express listening to the standard port
 * @type {http.Server}
 */
var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
