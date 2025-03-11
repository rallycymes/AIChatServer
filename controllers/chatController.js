const chatModel = require('../models/chatModel');

function CONTROLLERS (dbfilepath) {
    //internal model variable of the chats
    const CHATS = new chatModel.MODEL(dbfilepath);

    this.getFinalDB = function() {
        return CHATS.getFinalDB();
    }

    this.getChatsList = function() {
        return CHATS.getChatsList();
    }

    this.getChat = function(id) {
        return CHATS.getChat(id);
    }

    this.setChatTitle = function(id, new_title) {
        return CHATS.setChatTitle(id, new_title);
    }

    this.createNewChat = function() {
        return CHATS.createNewChat();
    }

    this.sendChatMessage = function(messageparams) {

        if(messageparams.ispreparemode) {//Update the model with the prepared message and return updated chat
            return CHATS.addPreparedMessage(messageparams);
        }
        else {//Send chat with newest message to AI service. Update the model with the response and return updated chat
            if(messageparams.retry || messageparams.schedule) {//Message needs to be handled by a scheduler for timing purposes
                return CHATS.sendTimedRetryMessage(messageparams);
            }
            else {//Single-try, immediate message send. Can be handled directly by the model. 
                return CHATS.sendMessage(messageparams);
            }
        }
    }
}

module.exports = { CONTROLLERS };