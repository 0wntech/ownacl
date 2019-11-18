const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const { throwError } = require("./utils.js");

function read(options = {}) {
  if (!this.body || options.force) {
    return this.fetcher
      .load(this.resource, { force: true, clearPreviousData: true })
      .then(() => {
        this.body = rdf.serialize(
          rdf.sym(this.resource),
          this.graph,
          this.resource,
          "text/turtle"
        );
        console.log("Freshly fetched");
        return this.body;
      });
  } else {
    return Promise.resolve(this.body);
  }
}

function readAgentsAndAccess(options = {}) {
  return this.read(options).then(() => {
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

function readAccess(identifier, options = {}) {
  return this.read(options).then(() => {
    if (identifier.split("#")[0] === this.resource)
      return this.graph
        .each(rdf.sym(identifier), ns.acl("mode"))
        .map(accessMode => accessMode.value)
        .sort();
    const possibleIdentifier = this.graph
      .statementsMatching(null, ns.acl("agent"), rdf.sym(identifier))
      .concat(
        this.graph.statementsMatching(
          null,
          ns.acl("agentClass"),
          rdf.sym(identifier)
        ),
        this.graph.statementsMatching(
          null,
          ns.acl("origin"),
          rdf.sym(identifier)
        )
      );
    const agentIdentifier =
      possibleIdentifier.length > 0 ? possibleIdentifier[0].subject : null;
    if (!agentIdentifier) {
      throwError(
        "Please specify a valid webId, url, agentClass or access identifier. Received: " +
          identifier
      );
    }
    return this.graph
      .each(agentIdentifier, ns.acl("mode"))
      .map(accessMode => accessMode.value)
      .sort();
  });
}

function readAgents(options = {}) {
  return this.read(options).then(() => {
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

function readAgentGroups(options = {}) {
  return this.read(options).then(() => {
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
