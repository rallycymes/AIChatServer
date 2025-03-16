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

    function prepareSend(chat) {

    }

    async function SendToAI(sendbody) {
        //Spoof response for now
        return new Promise((resolve) => {
            setTimeout(() => {
                const spoofresponse = fs.readFileSync("Spoof.json", 'utf8');
                resolve(JSON.parse(spoofresponse));
            }, 3000);
        });
    }

    function getChatItemIndex(chat, isparallel = false) {
        if(chat.messages.length == 0)
            return 0;
        if(chat.messages.length == 1)
            return isparallel ? 1 : 0;

        let new_chat_item_display_index = chat.messages.reduce(function(prev, current) {
            return (prev && prev.display_index > current.display_index) ? prev : current
        }).display_index;
        return isparallel ? new_chat_item_display_index : new_chat_item_display_index + 1;
    }

    function buildNewBubble(display_index, status, user, text) {
        return {
            display_index: display_index,
            status: status,
            user: user,
            text: text,
        };
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
        let newdisplayindex = getChatItemIndex(chat);
        let preparedbubble = buildNewBubble(
            newdisplayindex,
            "unsent",
            messageparams.isaliassystem ? "system" : "user",
            messageparams.message
        );
        chat.messages.push(preparedbubble)
        return chat;
    }

    this.sendTimedRetryMessage = function(messageparams) {
        let chat = this.getChat(messageparams.my_id);
        return chat;
    }

    this.sendMessage = async function(messageparams) {
        //Get and add user bubble to chat model
        let chat = this.getChat(messageparams.my_id);
        let newdisplayindex = getChatItemIndex(chat);
        let sendingbubble = buildNewBubble(
            newdisplayindex,
            "sending",
            "user",
            messageparams.message
        );
        chat.messages.push(sendingbubble);

        //Send out API call for reply
        let sendbody = prepareSend(chat);
        let AIJSONResponse = await SendToAI(sendbody);

        //Add AI response bubble to chat model
        chat.raw_responses.push({
            associated_display_index: newdisplayindex,
            response: AIJSONResponse
        });
        sendingbubble.status = "sent";
        let AIText = AIJSONResponse.choices[AIJSONResponse.choices.length-1].message.content;
        let replybubble = buildNewBubble(
            newdisplayindex + 1,
            "valid reply",
            "system",
            AIText
        );
        chat.messages.push(replybubble);

        return chat;
    }
}

module.exports = { MODEL };