const app = require('express')()
// const server = require('http').Server(app)
var https = require('https');
var fs = require('fs');

var options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
  };
  var server =  https.createServer(options, app);

const io = require("socket.io")(server, {
	cors: {
		// origin: "https://localhost:3000",
		origin: "*",
		methods: [ "GET", "POST" ]
	}
})
const next = require('next')
var fs = require('fs');
var serverPort = 3000;


const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev })
const nextHandler = nextApp.getRequestHandler()



// fake DB
const messages = []
const users = {};
// socket.io server
io.on('connection', socket => {
  socket.on('message', (data) => {
    messages.push(data)
    socket.broadcast.emit('message', data)
  })


  if (!users[socket.id]) {
    users[socket.id] = socket.id;
        }
        socket.emit("yourID", socket.id);
        io.sockets.emit("allUsers", users);
        socket.on('disconnect', () => {
            delete users[socket.id];
        })

        socket.on("callUser", (data) => {
            io.to(data.userToCall).emit('hey', {signal: data.signalData, from: data.from});
        })

        socket.on("acceptCall", (data) => {
            io.to(data.to).emit('callAccepted', data.signal);
        })

})

nextApp.prepare().then(() => {
  app.get('/messages', (req, res) => {
    res.json(messages)
  })

  app.get('*', (req, res) => {
    return nextHandler(req, res)
  })

//   server.listen(3000, (err) => {
//     if (err) throw err
//     console.log('> Ready on http://localhost:3000')
//   })
  server.listen(serverPort, function(err) {
    if (err) throw err
	console.log('server up and running at %s port', serverPort);
  });
})