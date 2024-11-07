import wsConnector from "../utils/wsconnector";

// WS CLIENT INITIALIZATION
const wsURL = localStorage.getItem('wsURL')

export const wsClient = new wsConnector()

if (wsURL) wsClient.wsURL = wsURL