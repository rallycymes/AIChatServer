// server.js (Entry Point)

//Imports
const express = require('express');
const path = require('path');

//Other files
const helpers = require('./helpers');
const chatController = require('./controllers/chatController');

const app = express();

const envfile = ".env";
const env = helpers.getENV(envfile);

//Prepare singleton logger
const logpath = path.join(env.basepath, env.logpath);
const logger = new helpers.LOGGER(logpath);

//JSON chat db file path
const dbfilepath = path.join(env.basepath, env.dbfilepath);

//Instantiate controllers
const controllers = new chatController.CONTROLLERS(dbfilepath);

////////////////
//// Routes ////
////////////////

app.use(express.json()); // Middleware to parses JSON payloads

//Main page load
app.get('/', (req, res) => {
    //res.send(chatView.render());
    res.sendFile(path.join(env.basepath, env.staticpath, 'home.html'))
});

//Serve static files like CSS and JS
app.use('/static', express.static(path.join(env.basepath, env.staticpath)));

//Get list of chats with things like titles, timestamps, and chat ids
app.get('/chatlist', (req, res) => {
    const chatData = controllers.getChatsList();
    res.send(chatData);
});

//Get all data for a specific chat
app.get('/chat/:my_id(\\d+)', (req, res) => {
    const chatData = controllers.getChat(req.params.my_id);
    res.send(chatData);
});

//Set chat title
app.put('/chat/:my_id(\\d+)/set/title/:new_title', (req, res) => {
    controllers.setChatTitle(req.params.my_id, req.params.new_title);
    res.sendStatus(200);
});

//Create new chat
app.get('/chat/new', (req, res) => {
    const chatData = controllers.createNewChat();
    res.send(chatData);
});

//Send chat message
app.post('/chat/send', (req, res) => {
    controllers.sendChatMessage(req.body).then( chatData => {
        res.send(chatData);
    });
});


//////////////////////
//// Start server ////
//////////////////////

//Register to save and exit gracefully no matter how it happens. We want to make sure the DB saves
process.on('exit', () => { helpers.exitHandler('exit', dbfilepath, controllers.getFinalDB()) });
process.on('SIGINT', () => { helpers.exitHandler('SIGINT', dbfilepath, controllers.getFinalDB()) });
process.on('SIGUSR1', () => { helpers.exitHandler('SIGUSR1', dbfilepath, controllers.getFinalDB()) });
process.on('SIGUSR2', () => { helpers.exitHandler('SIGUSR2', dbfilepath, controllers.getFinalDB()) });
process.on('uncaughtException', () => { helpers.exitHandler('uncaughtException', dbfilepath) });

//Start Server
app.listen(env.serverport, () => {
    logger.writeAndLog(`Server running on http://localhost:${env.serverport}`);
});

