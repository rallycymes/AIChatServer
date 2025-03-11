const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const envfile = ".env";
const env = getENV(envfile);

const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: env.api_key
});

//Prepare logging constants
const runDateSuffix = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format, current date for the entire run
const logFileName = `log_${runDateSuffix}.txt`;
const filePath = path.join(env.logpath, logFileName);

//Run
main();

async function main() {
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }],
            model: "deepseek-chat",
        });

        writeAndLog(completion);
    }
    catch(error) {
        writeAndLog("");
        writeAndLog("Error: " + error.message, true);
        writeAndLog("");
    }
}



function getENV(env_filename) {
    let env = {};

    // Read the .env file
    const envFilePath = path.join(__dirname, env_filename);
    try {
        // Read the .env file synchronously
        const data = fs.readFileSync(envFilePath, 'utf8');

        // Split the file content by new lines
        const lines = data.split('\n');

        // Process each line
        lines.forEach(line => {
            // Trim whitespace and ignore empty lines or comments
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                // Split the line by the first colon
                const [key, ...values] = trimmedLine.split(':');
                const value = values.join(':').trim(); // Handle cases where value contains colons

                // Store the key-value pair in the object
                if (key) {
                    env[key.trim()] = value;
                }
            }
        });
    } catch (err) {
        console.error('Error reading .env file:', err);
    }
    return env;
}

function writeAndLog(content, isError = false) {
    if(isError)
        console.error(content)
    else
        console.log(content);

    writeLogToFile(content);
}

function writeLogToFile(logString) {
    // Ensure the folder exists
    if (!fs.existsSync(env.logpath)) {
        fs.mkdirSync(env.logpath, { recursive: true });
    }

    // Append the log string with a newline
    fs.appendFile(filePath, logString + '\n', (err) => {
        if (err) {
            writeAndLog('Error writing to log file:' + err, true);
        }
    });
}