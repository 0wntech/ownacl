const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);

function read() {
  if (!this.body) {
    return this.fetcher.load(this.resource).then(() => {
      this.body = rdf.serialize(
        rdf.sym(this.resource),
        this.graph,
        this.resource,
        "text/turtle"
      );
      return this.body;
    });
  } else {
    return Promise.resolve(this.body);
  }
}

function readAgentsAndAccess() {
  return this.read(this.resource).then(() => {
    return this.readAgents().then(agents => {
      return this.readAgentGroups().then(agentGroups => {
        agents = agents.concat(agentGroups);
        agents.map(agent => {
          return this.readAccess(agent.identifier).then(access => {
            agent.access = access;
            return agent;
          });
        });
        return agents;
      });
    });
  });
}

function readAccess(agent) {
  return this.read().then(() => {
    return this.graph
      .each(rdf.sym(agent), ns.acl("mode"))
      .map(accessMode => accessMode.value);
  });
}

function readAgents() {
  return this.read(this.resource).then(() => {
    const agents = this.graph
      .statementsMatching(null, ns.acl("agent"), null)
      .map(agent => {
        return {
          name: agent.object.value,
          type: "Agent",
          identifier: agent.subject.value
        };
      });
    return agents;
  });
}

function readAgentGroups() {
  return this.read(this.resource).then(() => {
    const agentGroups = this.graph
      .statementsMatching(null, ns.acl("agentClass"), null)
      .map(agentGroup => {
        return {
          name: agentGroup.object.value,
          type: "AgentGroup",
          identifier: agentGroup.subject.value
        };
      });
    return agentGroups;
  });
}

module.exports = {
  read,
  readAgentsAndAccess,
  readAccess,
  readAgents,
  readAgentGroups
};
