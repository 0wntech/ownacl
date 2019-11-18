const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const {
  getIdentifier,
  getAgentPredicate,
  getExistingAccess,
  makeAgent
} = require("./utils.js");

function addAgent(agent, options = {}) {
  agent = makeAgent(agent);
  return addAgentOrGroup(agent, this, options);
}

function addAgentOrGroup(agent, client, options = {}) {
  return client.readAgentsAndAccess({ force: true }).then(accessees => {
    agent.identifier = getIdentifier(agent, accessees, client.resource);
    let del = getExistingAccess(client.graph, agent);
    let ins = makeNewAccessTriples(client.graph, agent);
    if (options.debug) {
      console.log("Statements to delete: \n");
      console.log(del);
      console.log("\nStatements to insert: \n");
      console.log(ins);
    }

    return client.updater.update(del, ins);
  });
}

function addAgentGroup(agentGroup, options = {}) {
  agentGroup = makeAgent(agentGroup, { agentGroup: true });
  return addAgentOrGroup(agentGroup, this, options);
}

function makeNewAccessTriples(store, agent) {
  const agentPredicate = getAgentPredicate(agent);
  const newTriples = makeTriplesForIdentifier(agent);
  const existingTriples = store
    .statementsMatching(rdf.sym(agent.identifier))
    .filter(statement => {
      const agentPredicates = [
        ns.acl("origin").value,
        ns.acl("agent").value,
        ns.acl("agentClass").value
      ];
      return agentPredicates.lastIndexOf(statement.predicate.value) === -1;
    });
  if (JSON.stringify(newTriples) === JSON.stringify(existingTriples)) {
    console.log("Not creating a whole new access class");
    if (
      store.each(rdf.sym(agent.identifier), agentPredicate, rdf.sym(agent.name))
        .length === 0
    ) {
      return [
        rdf.st(
          rdf.sym(agent.identifier),
          agentPredicate,
          rdf.sym(agent.name),
          rdf.sym(agent.identifier).doc()
        )
      ];
    }
    return [];
  } else {
    console.log("Creating a whole new access class");
    newTriples.push(
      rdf.st(
        rdf.sym(agent.identifier),
        agentPredicate,
        rdf.sym(agent.name),
        rdf.sym(agent.identifier).doc()
      )
    );
    return newTriples;
  }
}

function makeTriplesForIdentifier(agent) {
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
