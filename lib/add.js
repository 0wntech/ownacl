const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const { getIdentifier } = require("./utils.js");

function addAgent(agent) {
  return this.readAgentsAndAccess().then(accessees => {
    agent.identifier = getIdentifier(agent, accessees, this.resource);
    let del = getExistingAccess(this.graph, agent);
    let ins = getNewAccess(this.graph, agent);
    return this.updater.update(del, ins).then(() => {
      return this.readAgentsAndAccess();
    });
  });
}

function addAgentGroup(agentGroup) {
  return addAgent(agentGroup);
}

function getExistingAccess(store, agent) {
  const agentPredicate = getAgentPredicate(agent);
  if (store.any(null, agentPredicate, rdf.sym(agent.name))) {
    const currIdentifiers = store
      .statementsMatching(null, agentPredicate, rdf.sym(agent.name))
      .map(statement => {
        return statement.subject.value;
      });
    if (currIdentifiers.length > 1) {
      currIdentifiers.forEach(identifier => {
        if (
          store.statementsMatching(rdf.sym(identifier), agentPredicate)
            .length === 1
        ) {
          return this.graph.statementsMatching(rdf.sym(identifier));
        } else {
          return store.statementsMatching(
            rdf.sym(currIdentifiers[0], agentPredicate, rdf.sym(agent.name))
          );
        }
      });
    } else {
      if (
        store.statementsMatching(rdf.sym(currIdentifiers[0]), agentPredicate)
          .length === 1
      ) {
        return store.statementsMatching(rdf.sym(currIdentifiers[0]));
      } else {
        return store.statementsMatching(
          rdf.sym(currIdentifiers[0], agentPredicate, rdf.sym(agent.name))
        );
      }
    }
  }
}

function getNewAccess(store, agent) {
  const agentPredicate = getAgentPredicate(agent);
  if (store.any(rdf.sym(agent.identifier))) {
    return rdf.st(
      rdf.sym(agent.identifier),
      agentPredicate,
      rdf.sym(agent.name),
      rdf.sym(agent.identifier).doc()
    );
  } else {
    return getTriplesOfAgent(agent);
  }
}

function getAgentPredicate(agent) {
  return agent.type !== "Origin"
    ? agent.type === "Agent"
      ? ns.acl("agent")
      : ns.acl("agentClass")
    : ns.acl("origin");
}

function getTriplesOfAgent(agent) {
  const agentPredicate = getAgentPredicate(agent);
  return [
    rdf.st(
      rdf.sym(agent.identifier),
      ns.rdf("type"),
      ns.acl("Authorization"),
      rdf.sym(agent.identifier).doc()
    ),
    rdf.st(
      rdf.sym(agent.identifier),
      ns.acl("accessTo"),
      rdf.sym(
        agent.identifier.substr(0, agent.identifier.lastIndexOf("/")) + "/"
      ),
      rdf.sym(agent.identifier).doc()
    ),
    rdf.st(
      rdf.sym(agent.identifier),
      agentPredicate,
      rdf.sym(agent.name),
      rdf.sym(agent.identifier).doc()
    ),
    rdf.st(
      rdf.sym(agent.identifier),
      ns.acl("default"),
      rdf.sym(
        agent.identifier.substr(0, agent.identifier.lastIndexOf("/")) + "/"
      ),
      rdf.sym(agent.identifier).doc()
    )
  ].concat(
    agent.access.map(accessMode => {
      return rdf.st(
        rdf.sym(agent.identifier),
        ns.acl("mode"),
        rdf.sym(accessMode),
        rdf.sym(agent.identifier).doc()
      );
    })
  );
}

module.exports = { addAgent, addAgentGroup };
