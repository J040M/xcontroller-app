import wsConnector from "./wsconnector";


// WS CLIENT INITIALIZATION
// get URL from storage if it exists
const wsURL = localStorage.getItem('wsURL')
// Create client
export const wsClient = new wsConnector()
// Define Ws ip
if (wsURL) wsClient.wsURL = wsURL