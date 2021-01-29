const { SolidNodeClient } = require("solid-node-client");
const config = require("dotenv").config();

exports.login = async () => {
  const nodeClient = new SolidNodeClient();
  if (!nodeClient.session?.webId) {
    await nodeClient.login(config);
    return nodeClient;
  } else {
    return nodeClient;
  }
};
