const express = require('express'),
    session = require('express-session'),
    app = express(),
    http = require('node:http'),
    ddos = require("ddos-express"),
    https = require('node:https'),
    uuid = require('uuid'),
    fs = require(`fs`),
    sio = require('socket.io'),
    uuidv4 = uuid.v4;

var argv = require('minimist')(process.argv.slice(2));

const HOST = 'z34407.adman.cloud';
//const HOST = 'passt.site';
const PORT = 7000;
const S_PORT = 443;

const options = {
    key: fs.readFileSync(`keys/${HOST}/privkey1.pem`),
    cert: fs.readFileSync(`keys/${HOST}/fullchain1.pem`)
};

const server = https.createServer(options, app);
server.listen(S_PORT);

const serverLocal = http.createServer(app);
serverLocal.listen(PORT);

const io = sio(argv.l ? serverLocal : server);

app.set('view engine', 'ejs');
app.enable('trust proxy');

app.use(function (request, response, next) {
    if (!argv.l && !request.secure) {
        return response.redirect("https://" + request.headers.host + request.url);
    }
    next();
});
// app.use(ddos({
//     weight: 1,
//     maxWeight: 10,
//     checkInterval: 1000
// }));

app.use(express.static(__dirname));
app.use(session({
    secret: 'd73hd77YAQ73EHAEWF7DFUSIHF334sdg',
    resave: false,
    saveUninitialized: true
}));

Array.prototype.remove = function (socketId) {
    let index = -1;
    this.map((v, i) => {
        if (v.mid === socketId) index = i;
    });
    if (index > -1) this.splice(index, 1);
};

Array.prototype.logValues = function () {
    this.map((v, i) => {
        console.log(v)
    });
};

let clients = [];

io.on('connection', (socket) => {

    console.log('Connection ' + socket.id);

    socket.on('test', (message) => {
        let d = JSON.parse(message);
        clients.map((v, i) => {
            if (v.cid === d.cid) {
                io.to(v.mid).emit('pass transfer', d.text);
            }
        })
    });

    socket.on('register', (clientId) => {
        if (argv.l) console.log(`WS check from ${clientId}`);
        clients.map((v) => {
            if (v.cid === clientId) {
                v.mid = socket.id;
                io.to(v.mid).emit('connected', v.cid);
                if (argv.l) console.log(`${v.sid} connected with ${clientId}`);
            }
        });
    });

    socket.on('disconnect', () => {
        if (argv.l) {
            console.log(`Disconnect ${socket.id}`);
            clients.logValues();
        }
        clients.remove(socket.id);
        clients.logValues();
    })
});

// to test mode: /connect?mode=2
app.get('/', (req, res) => {
    if (argv.l) console.log(`HTTP connect >> ${req.sessionID}`);
    let clientId = initConnection(argv.l, req.sessionID);
    res.render('main', {clientId: clientId, mode: req.query.mode, page: 'main'})
});

app.get('/contacts', (req, res) => {
    res.render(`contacts`, {page: 'contacts'});
});

app.get('/download', (req, res) => {
    res.render(`download`, {page: 'download'});
});

app.get('/help', (req, res) => {
    res.render(`help`, {page: 'help'});
});

app.get('/privacy', (req, res) => {
    res.render(`privacy`, {page: 'privacy'});
});

app.get('/info', (req, res) => {
    res.render(`info`, {page: 'info'});
});

app.get('/contacts', (req, res) => {
    res.render(`contacts`, {page: 'contacts'});
});

app.get('/test', (req, res) => {
    res.render('test', {page: 'test'})
});

// подключение по REST
app.get('/connect/:sid', (req, res) => {
    if (argv.l) console.log(`REST connect >> ${req.params.sid}`);
    let clientId = initConnection(argv.l, req.params.sid);
    return res.status(clientId !== '' ? 200 : 404).set('Content-Type', 'text/plain').end(clientId);
});

//отправка сообщения конкретному клиенту по его id
app.get('/send/:cid/:msg', (req, res) => {
    if (argv.l) console.log(`REST send by ${req.params.cid}`);
    let result = 0;
    clients.map((v) => {
        if (v.cid === req.params.cid) {
            io.to(v.mid).emit('pass transfer', req.params.msg);
            if (argv.l) console.log(`Sent '${req.params.msg}' to ${v.sid}`);
            result++;
        }
    });
    return processResponse(result, res);
});

//уведомление о подключении
app.get('/notify/:cid/:name', (req, res) => {
    if (argv.l) console.log(`REST notify from ${req.params.name}`);
    let result = 0;
    clients.map((v) => {
        if (v.cid === req.params.cid) {
            io.to(v.mid).emit('notify', req.params.name);
            if (argv.l) console.log(`App ${req.params.name} connected with ${req.params.cid}`);
            result++;
        }
    });
    return processResponse(result, res);
});

//завершить сессию
app.get('/close/:cid', (req, res) => {
    if (argv.l) console.log(`REST close by ${req.params.cid}`);
    let mIds = [];
    clients.map((v) => {
        if (v.cid === req.params.cid) {
            io.to(v.mid).disconnectSockets(true);
            mIds.push(v.mid);
            if (argv.l) console.log(`Closed session ${v.sid}`);
        }
    });
    if (argv.l) clients.logValues();
    mIds.map((v) => clients.remove(v));
    return processResponse(mIds.length, res);
});

function initConnection(logEnable, sid) {
    let clientId = '';
    clients.map((v) => {
        if (v.sid === sid) {
            clientId = v.cid;
        }
    });
    if (clientId === '') {
        clientId = uuidv4();
        clients.push({
            sid: sid,           // http session id
            cid: clientId,      // server generated client uuid
            mid: ''             // web socket id
        });
        if (logEnable) console.log(`init SID:CID >> ${sid}:${clientId}`);
    }
    return clientId;
}

function processResponse(result, res) {
    return res.status(result > 0 ? 200 : 404).set('Content-Type', 'text/plain').end(result > 0 ? 'OK' : 'NOT FOUND');
}