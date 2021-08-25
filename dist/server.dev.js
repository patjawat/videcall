"use strict";

var app = require('express')(); // const server = require('http').Server(app)


var https = require('https');

var fs = require('fs');

var options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};
var server = https.createServer(options, app);

var io = require("socket.io")(server, {
  cors: {
    // origin: "https://localhost:3000",
    origin: "*",
    methods: ["GET", "POST"]
  }
});

var next = require('next');

var fs = require('fs');

var serverPort = 3000;
var dev = process.env.NODE_ENV !== 'production';
var nextApp = next({
  dev: dev
});
var nextHandler = nextApp.getRequestHandler(); // fake DB

var messages = [];
var users = {}; // socket.io server

io.on('connection', function (socket) {
  socket.on('message', function (data) {
    messages.push(data);
    socket.broadcast.emit('message', data);
  });

  if (!users[socket.id]) {
    users[socket.id] = socket.id;
  }

  socket.emit("yourID", socket.id);
  io.sockets.emit("allUsers", users);
  socket.on('disconnect', function () {
    delete users[socket.id];
  });
  socket.on("callUser", function (data) {
    io.to(data.userToCall).emit('hey', {
      signal: data.signalData,
      from: data.from
    });
  });
  socket.on("acceptCall", function (data) {
    io.to(data.to).emit('callAccepted', data.signal);
  });
});
nextApp.prepare().then(function () {
  app.get('/messages', function (req, res) {
    res.json(messages);
  });
  app.get('*', function (req, res) {
    return nextHandler(req, res);
  }); //   server.listen(3000, (err) => {
  //     if (err) throw err
  //     console.log('> Ready on http://localhost:3000')
  //   })

  server.listen(serverPort, function (err) {
    if (err) throw err;
    console.log('server up and running at %s port', serverPort);
  });
});