const rdf = require("rdflib");
const { getIdentifier, getExistingAccess, makeAgent } = require("./utils.js");

function deleteAgent(agent, options = {}) {
  agent = makeAgent(agent);
  return deleteAgentOrGroup(agent, this, options);
}

function deleteAgentOrGroup(agent, client, options = {}) {
  return client.readAgentsAndAccess({ force: true }).then(accessees => {
    agent.identifier = getIdentifier(agent, accessees, client.resource);
    let del = getExistingAccess(client.graph, agent);
    let ins = [];
    if (options.debug) {
      console.log("Statements to delete: \n");
      console.log(del);
    }
    return client.updater.update(del, ins);
  });
}

module.exports = { deleteAgent };
