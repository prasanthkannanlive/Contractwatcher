import Web3 from "web3";
import fetch from "node-fetch";
import http from "http";
import dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config(); // Load environment variables from .env file

// Initialize Web3 with Infura WebSocket provider
const web3 = new Web3(
    new Web3.providers.WebsocketProvider(
        `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_PROJECT_ID}`,
    ),
);

// Telegram bot details
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

// Contract details
const contractAddress = process.env.CONTRACT_ADDRESS;
let contractABI;

try {
    contractABI = JSON.parse(readFileSync("./contractABI.json", "utf8")); // Load the contract ABI from a JSON file
} catch (error) {
    console.error("Error loading contract ABI:", error);
    process.exit(1); // Exit the process with an error code
}

// Create contract instance
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Check if the contract instance is created correctly
if (!contract || !contract.events) {
    console.error("Error: Contract instance or events object is undefined");
    process.exit(1); // Exit the process with an error code
}

// Port to listen on
const port = process.env.PORT || 3000;



// Subscribe to all events of the contract
contract.events.allEvents()
    .on('data', event => {
        console.log('Event received:', event);

        // Format the message
        const message = `New event on contract ${contractAddress}:\n${JSON.stringify(event, null, 2)}`;

        // Send message to Telegram
        fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text: message
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Message sent to Telegram:', data);
            console.log('Telegram Bot Token:', telegramBotToken);
            console.log('Telegram Chat ID:', telegramChatId);
        })
        .catch(error => {
            console.error('Error sending message to Telegram:', error);
        });
    })
    .on('error', error => {
        console.error('Error subscribing to contract events:', error);
    });

// Create an HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Contract event watcher is running\n");
});

// Start the server
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
