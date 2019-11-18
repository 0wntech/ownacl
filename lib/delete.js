const rdf = require("rdflib");
const { getIdentifier, getExistingAccess, makeAgent } = require("./utils.js");

function deleteAgent(agent, options = {}) {
  return prepareInput(agent, this).then(agent => {
    agent = makeAgent(agent);
    return deleteAgentOrGroup(agent, this, options);
  });
}

function deleteAgentOrGroup(agent, client, options = {}) {
  return client.readAgentsAndAccess({ force: true }).then(accessees => {
    agent.identifier = getIdentifier(agent, accessees, client.resource);
    let del = getExistingAccess(client.graph, agent, { force: true });
    let ins = [];
    if (options.debug) {
      console.log("Statements to delete: \n");
      console.log(del);
    }
    return client.updater.update(del, ins);
  });
}

function deleteAgentGroup(agentGroup, options = {}) {
  return prepareInput(agentGroup, this).then(agentGroup => {
    agentGroup = makeAgent(agentGroup, { agentGroup: true });
    return deleteAgentOrGroup(agentGroup, this, options);
  });
}

function prepareInput(agent, client) {
  if (typeof agent === "string") agent = { name: agent };
  if (!agent.access) {
    return client.readAccess(agent.name).then(access => {
      agent.access = access;
      return agent;
    });
  } else {
    return Promise.resolve(agent);
  }
}

module.exports = { deleteAgent, deleteAgentGroup };
