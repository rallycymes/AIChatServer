const fs = require('fs');

//Singleton chats model class
function MODEL (chatdbfilepath) {
    let DB = getChatData(chatdbfilepath)

    let most_recent_id = DB.chats.reduce(function(prev, current) {
        return (prev && prev.my_id > current.my_id) ? prev : current
    }).my_id;

    function getChatData(dbfilepath) {
        try {
            const data = fs.readFileSync(dbfilepath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading chat data:', error);
            return null;
        }
    }

    //To enable graceful save and exit
    this.getFinalDB = function() {
        return JSON.stringify(DB, null, "\t");
    }

    this.getChatsList = function() {
        let chatslist = { chats : [] };
        for(let i=0; i<DB.chats.length; i++) {
            chatslist.chats.push({
                my_id: DB.chats[i].my_id,
                datetime_initiated: DB.chats[i].datetime_initiated,
                friendly_title: DB.chats[i].friendly_title
            });
        }
        return chatslist;
    }

    this.getChat = function(my_id) {
        let intid = parseInt(my_id);
        return DB.chats.find(chat => chat.my_id === intid);
    }

    this.setChatTitle = function(my_id, new_title) {
        let intid = parseInt(my_id);
        let matchingchat = DB.chats.find(chat => chat.my_id === intid);
        matchingchat.friendly_title = new_title;
    }

    this.createNewChat = function() {
        let newid = most_recent_id + 1;
        most_recent_id = newid;

        const newchat = {
            my_id : newid,
            datetime_initiated : new Date(),
            friendly_title : "New Chat " + newid,
            messages : [],
            raw_responses : []
        }

        DB.chats.push(newchat);
        return newchat;
    }

    this.addPreparedMessage = function(messageparams) {
        let chat = this.getChat(messageparams.my_id);
        chat.messages.push({
            user: messageparams.isaliassystem ? "system" : "user",
            text: messageparams.message
        })
        return chat;
    }

    this.sendTimedRetryMessage = function(messageparams) {
        let chat = this.getChat(messageparams.my_id);
        return chat;
    }

    this.sendMessage = function(messageparams) {
        let chat = this.getChat(messageparams.my_id);
        return chat;
    }
}

module.exports = { MODEL };