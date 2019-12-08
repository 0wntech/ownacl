const {
  getIdentifier,
  getExistingAccess,
  makeEntity,
  throwError
} = require("./utils.js");

function deleteEntity(entity, client, options) {
  if (!entity || !entity.type || !entity.name)
    throwError("You must need to specify a type and name to delete an entity.");
  return prepareInput(entity, client).then(entity => {
    entity = makeEntity(entity, {
      agentGroup: entity.type === "AgentGroup",
      origin: entity.type === "Origin"
    });
    return deleteAccess(entity, client, options);
  });
}

function deleteAgent(agent, options = {}) {
  if (typeof agent === "string") agent = { name: agent };
  if (!agent.type) agent = { ...agent, type: "Agent" };
  return deleteEntity(agent, this, options);
}

function deleteAgentGroup(agentGroup, options = {}) {
  if (typeof agentGroup === "string") agentGroup = { name: agentGroup };
  if (!agentGroup.type) agentGroup = { ...agentGroup, type: "AgentGroup" };
  return deleteEntity(agentGroup, this, options);
}

function deleteOrigin(origin, options = {}) {
  if (typeof origin === "string") origin = { name: origin };
  if (!origin.type) origin = { ...origin, type: "Origin" };
  return deleteEntity(origin, this, options);
}

function deleteAccess(agent, client, options = {}) {
  return client.readAccessControl({ force: true }).then(accessees => {
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

module.exports = { deleteAgent, deleteAgentGroup, deleteOrigin, deleteEntity };
