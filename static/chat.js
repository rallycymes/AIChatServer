//// API call functions ////
async function fetchChatList() {
    const response = await fetch("/chatlist");
    const data = await response.json();
    return data.chats;
}

async function fetchChat(my_id) {
    const response = await fetch(`/chat/${my_id}`);
    const data = await response.json();
    return data;
}

async function getNewChat() {
    const response = await fetch(`/chat/new`);
    const data = await response.json();
    return data;
}

async function updateChatTitle(myId, oldTitle, newTitle) {
    const response = await fetch(`/chat/${myId}/set/title/${encodeURIComponent(newTitle)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (response.ok) {
        console.log("Chat title updated successfully!");
        //On success, update main chat title and sidebar title to match new title.
        updateTitles(newTitle);
    } else {
        console.error("Error updating chat title:", response.status);
        updateTitles(oldTitle);
    }
}

async function sendChatMessage() {
    //Collect all input parameters from the GUI and construct the HTTP POST
    //Success returns with the entire updated chat object

    const messageparams = {
        my_id: mainchattitle.dataset.myId,
        message: chatinput.value,
        ispreparemode: sendModeBtn.classList.contains("highlighted"),
        reasoning: reasoningBtn.classList.contains("highlighted"),
        retry: retryBtn.classList.contains("highlighted"),
        schedule: scheduleBtn.classList.contains("highlighted"),
        isaliassystem: aliasBtn.classList.contains("highlighted")
    }
    //As soon as request body is prepared, clear the chat input. We don't want it waiting on a reply.
    chatinput.value = '';

    const response = await fetch(`/chat/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageparams)
    });

    if (response.ok) {
        console.log("Message sent succesfully.");
        return await response.json();
    } else {
        console.error("Error sending message:", response.status);
        return null;
    }
}

//// HTML render functions ////

function renderSidebar(chats) {
    chats.forEach(chat => {
        renderSidebarChat(chat)
    });
}

function renderSidebarChat(chat) {
    const li = document.createElement("li");
    li.classList.add("chat-title");
    li.textContent = chat.friendly_title;
    li.dataset.myId = chat.my_id; // Attach matching my_id
    
    // Register click event to fetch and render new chat data
    li.addEventListener("click", async function() {
        try {
            const chatId = this.dataset.myId;
            const chatData = await fetchChat(chatId);
            renderMainChat(chatData);
        } catch (error) {
            console.error("Error fetching chat data:", error);
        }
    });

    
    sidebarchatlist.prepend(li);
}

function renderMainChat(chatData) {
    // Fill or replace main chat div elements data
    mainchattitle.textContent = chatData.friendly_title;
    mainchattitle.dataset.myId = chatData.my_id;
    chatitems.innerHTML = "";
    chatData.messages.forEach(msg => {
        const chatitem = document.createElement("div");
        chatitem.classList.add("chatitem");
        const chatitemaliasclass = msg.user == "user" ? "chatitemuser" : "chatitemsystem";
        chatitem.classList.add(chatitemaliasclass);
        chatitem.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
        chatitems.appendChild(chatitem);
    });
}

function saveTitle(oldTitle) {
    const input = mainchattitle.querySelector("input");
    const newTitle = input.value.trim();
    if (newTitle) {
        const chatId = mainchattitle.dataset.myId;
        updateChatTitle(chatId, oldTitle, newTitle);
    }
    mainchattitle.classList.remove("editing");
}

function updateTitles(titleText) {
        mainchattitle.innerHTML = titleText;
        let activeli = Array.from(sidebarchatlist.childNodes).find(li => li.dataset.myId === mainchattitle.dataset.myId)
        activeli.innerText = titleText; 
}

function toggleButton(button) {
    button.classList.toggle("highlighted");
    if (button.classList.contains("highlighted")) {
        button.style.backgroundColor = "#4a90e2"; // Lighter blue
    } else {
        button.style.backgroundColor = ""; // Reset to default
    }
}


//// Main Run ////

//Assign standard element pointers
const sidebar = document.getElementById("sidebar");
let newchatbutton = document.getElementById("newchatbutton");
const sidebarchatlist = document.getElementById("sidebarchatlist");

const mainchattitle = document.getElementById("mainchattitle");
const chatitems = document.getElementById("chatitems");

const statusSection = document.getElementById("statussection");
const toggleStatusSection = document.getElementById("toggle-status-section");
const statusMessages = document.getElementById("statusmessages");

const chatinput = document.getElementById("chatinput");
const sendBtn = document.getElementById("send-button");
const sendModeBtn = document.getElementById("sendmode");
const aliasBtn = document.getElementById("alias");
const reasoningBtn = document.getElementById("reasoning");
const retryBtn = document.getElementById("retry");
const scheduleBtn = document.getElementById("schedule");

// On page load, initialize and fill out elements. Assign event listeners.
document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Get chat list and render sidebar
        const chats = await fetchChatList();
        if (chats.length === 0) {
            console.error("No chats available");
            return;
        }
        renderSidebar(chats);

        // Fetch and render the most recent chat's details and messages
        const recentChatData = await fetchChat(chats[chats.length-1].my_id);
        renderMainChat(recentChatData);
    } catch (error) {
        console.error("Error fetching chat data:", error);
    }

    //Register new chat request and re-render functionality.
    newchatbutton.addEventListener("click", async function() {
        try {
            const chatData = await getNewChat();
            renderMainChat(chatData);
            renderSidebarChat(chatData);
    
        } catch (error) {
            console.error("Error fetching chat data:", error);
        }
    });

    //Register send message request
    sendBtn.addEventListener("click", async function() {
        let loadingElement;
        try {
            const messageText = chatinput.value.trim();
            if (!messageText) return;

            //Disable send button first, use this as mutex
            sendBtn.disabled = true;
    
            // Optimistically add user's message
            const userMsgElement = document.createElement('div');
            userMsgElement.classList.add("chatitem", "chatitemuser");
            userMsgElement.innerHTML = `<strong>user:</strong> ${messageText}`;
            chatitems.appendChild(userMsgElement);
    
            // Add loading animation for system response
            loadingElement = document.createElement('div');
            loadingElement.classList.add("chatitem", "chatitemsystem", "loading");
            loadingElement.innerHTML = `
                <div class="loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                </div>
            `;
            chatitems.appendChild(loadingElement);
            
            //Send chat message
            const chatData = await sendChatMessage();
            
            // Response received, render all chat items
            renderMainChat(chatData);    
            
            //Re-enable send button, release mutex
            sendBtn.disabled = false;
    
        } catch (error) {
            console.error("Error sending chat request:", error);
            if (loadingElement) loadingElement.remove();
            sendBtn.disabled = false;
        }
    });

    toggleStatusSection.addEventListener("click", function () {
        statusSection.classList.toggle("collapsed");

        // Toggle icon direction
        const statusSectionIconPath = toggleStatusSection.querySelector("path");
        if (statusSection.classList.contains("collapsed")) {
            statusSectionIconPath.setAttribute("d", "M16 19V5L5 12z");
            statusMessages.style.display = "none";
        } else {
            statusSectionIconPath.setAttribute("d", "M8 5v14l11-7z");
            statusMessages.style.display = "inline-block";
        }
    });

    //Add chat input textbox resize functionality
    chatinput.addEventListener("input", function () {
        chatinput.style.height = "40px"; // Reset height
        chatinput.style.height = Math.min(chatinput.scrollHeight, 400) + "px"; // Expand up to 600px
    });

    //Register title editing event listener
    mainchattitle.addEventListener("dblclick", function () {
        if (!mainchattitle.classList.contains("editing")) {
            mainchattitle.classList.add("editing");
            const currentTitle = mainchattitle.textContent;
            mainchattitle.innerHTML = `<input type="text" value="${currentTitle}" />`;

            const input = mainchattitle.querySelector("input");
            input.focus();
            input.addEventListener("blur", function (event) {
                saveTitle(currentTitle);
            });
            input.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    saveTitle(currentTitle);
                }
            });
        }
    });

    //This group of click event listener is for highlighting and hiding toggle buttons based on possible chat send options and combinations.
    sendModeBtn.addEventListener("click", function () {
        toggleButton(sendModeBtn);
        if (sendModeBtn.classList.contains("highlighted")) {
            sendModeBtn.textContent = "Prepare";

            aliasBtn.style.display = "inline-block";
            reasoningBtn.style.display = "none";
            retryBtn.style.display = "none";
            scheduleBtn.style.display = "none";
        } else {
            sendModeBtn.textContent = "Send";

            aliasBtn.style.display = "none";
            reasoningBtn.style.display = "inline-block";
            retryBtn.style.display = "inline-block";
            scheduleBtn.style.display = "inline-block";
        }
    });
    aliasBtn.addEventListener("click", function () {
        toggleButton(aliasBtn);
        if (aliasBtn.classList.contains("highlighted")) {
            aliasBtn.textContent = "Alias System";
        } else {
            aliasBtn.textContent = "Alias User";
        }
    });
    reasoningBtn.addEventListener("click", function () {
        toggleButton(reasoningBtn);
    });
    retryBtn.addEventListener("click", function () {
        toggleButton(retryBtn);
    });
    scheduleBtn.addEventListener("click", function () {
        toggleButton(scheduleBtn);
    });
});


