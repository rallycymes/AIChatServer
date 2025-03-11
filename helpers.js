const fs = require('fs');
const path = require('path');

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

//Singleton logger class
function LOGGER (logpath) {
    const rundatesuffix = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format, current date for the entire run
    const logfilename = `log_${rundatesuffix}.txt`;
    const logfilePath = path.join(logpath, logfilename);

    this.writeAndLog = function(content, isError = false) {
        if(isError)
            console.error(content)
        else
            console.log(content);
    
        writeLogToFile(content);
    }
    
    function writeLogToFile(logString) {
        // Ensure the folder exists
        if (!fs.existsSync(logpath)) {
            fs.mkdirSync(logpath, { recursive: true });
        }
    
        // Append the log string with a newline
        fs.appendFile(logfilePath, logString + '\n', (err) => {
            if (err) {
                writeAndLog('Error writing to log file:' + err, true);
            }
        });
    }
}

let exithandled = false;
function exitHandler(exittype, dbfilepath, finaldbstring) {
    if(exithandled)
        return;
    exithandled = true;
    
    console.log("Exiting gracefully with type [ " + exittype +" ] ...");

    console.log("Saving DB...");
    fs.writeFile(dbfilepath, finaldbstring, { encoding: 'utf8' }, (err) => {
        if (err) {
            console.error('Error writing DB file:', err);
        } else {
            console.log('DB save complete. Now exiting.');
        }

        process.exit(1)
    });
}

module.exports = { LOGGER, getENV, exitHandler };