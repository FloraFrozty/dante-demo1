import 'dotenv/config'
import { oa_cli } from './module/openaiConfig'
import OpenAI from 'openai' 
import { createThreadMessage, newThread, executeThread } from './module/assistant';
import fs from 'fs';
import readline from 'readline';

const CONFIG = {
    threadID: "",
    assistantID: "asst_tQvfyY60gcV1auxkiTGR0F3m"
}

const processInput = async (text:string) => {
    if (text === ":exit") {
        console.log("Exiting Terminal Application...");
        process.exit();
    }
    if (!CONFIG.assistantID) {
        console.log("Assistant ID doesn't Exist");
        return;
    }
    await createThreadMessage(CONFIG.threadID, text);
    await executeThread(CONFIG.threadID,CONFIG.assistantID);
    return;
};

const main = async () => {
    if (!fs.existsSync('../temp/local.txt')) {
        const threadID = (await newThread()).id;
        fs.writeFileSync('../temp/local.txt', threadID);
    } else {
        CONFIG.threadID = fs.readFileSync('../temp/local.txt').toString();
    }

    console.log(JSON.stringify(CONFIG, null, 2));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    rl.on('line', (line) => {
        processInput(line);
    });

};

main();