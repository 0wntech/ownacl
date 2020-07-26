const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const {
  getIdentifier,
  getAgentPredicate,
  getExistingAccess,
  makeEntity,
} = require("./utils.js");

function addAgent(agent, options = {}) {
  agent = makeEntity(agent);
  return addEntity(agent, this, options);
}

function addAgentGroup(agentGroup, options = {}) {
  agentGroup = makeEntity(agentGroup, { agentGroup: true });
  return addEntity(agentGroup, this, options);
}

function addOrigin(origin, options = {}) {
  origin = makeEntity(origin, { origin: true });
  return addEntity(origin, this, options);
}

function addPublicAccess(access) {
  const agentGroup = {
    name: "http://xmlns.com/foaf/0.1/Agent",
    type: "AgentGroup",
    access: access,
  };
}

function addEntity(entity, client, options = {}) {
  return client.readAccessControl({ force: true }).then((accessees) => {
    entity.identifier = getIdentifier(entity, accessees, client.resource);
    let del = getExistingAccess(client.graph, entity);
    let ins = makeNewAccessTriples(client.graph, entity);
    if (options.debug) {
      console.log("Statements to delete: \n");
      console.log(del);
      console.log("\nStatements to insert: \n");
      console.log(ins);
    }

    return client.updater.update(del, ins);
  });
}

function makeNewAccessTriples(store, entity) {
  const entityPredicate = getAgentPredicate(entity);
  const newTriples = makeTriplesForIdentifier(entity);
  const existingTriples = store
    .statementsMatching(rdf.sym(entity.identifier))
    .filter((statement) => {
      const entityPredicates = [
        ns.acl("origin").value,
        ns.acl("agent").value,
        ns.acl("agentClass").value,
      ];
      return entityPredicates.lastIndexOf(statement.predicate.value) === -1;
    });
  if (JSON.stringify(newTriples) === JSON.stringify(existingTriples)) {
    console.log("Not creating a whole new access class");
    if (
      store.each(
        rdf.sym(entity.identifier),
        entityPredicate,
        rdf.sym(entity.name)
      ).length === 0
    ) {
      return [
        rdf.st(
          rdf.sym(entity.identifier),
          entityPredicate,
          rdf.sym(entity.name),
          rdf.sym(entity.identifier).doc()
        ),
      ];
    }
    return [];
  } else {
    console.log("Creating a whole new access class");
    newTriples.push(
      rdf.st(
        rdf.sym(entity.identifier),
        entityPredicate,
        rdf.sym(entity.name),
        rdf.sym(entity.identifier).doc()
      )
    );
    return newTriples;
  }
}

function makeTriplesForIdentifier(entity) {
  return [
    rdf.st(
      rdf.sym(entity.identifier),
      ns.rdf("type"),
      ns.acl("Authorization"),
      rdf.sym(entity.identifier).doc()
    ),
    rdf.st(
      rdf.sym(entity.identifier),
      ns.acl("accessTo"),
      rdf.sym(
        entity.identifier.substr(0, entity.identifier.lastIndexOf("/")) + "/"
      ),
      rdf.sym(entity.identifier).doc()
    ),
    rdf.st(
      rdf.sym(entity.identifier),
      ns.acl("default"),
      rdf.sym(
        entity.identifier.substr(0, entity.identifier.lastIndexOf("/")) + "/"
      ),
      rdf.sym(entity.identifier).doc()
    ),
  ].concat(
    entity.access.map((accessMode) => {
      return rdf.st(
        rdf.sym(entity.identifier),
        ns.acl("mode"),
        rdf.sym(accessMode),
        rdf.sym(entity.identifier).doc()
      );
    })
  );
}

module.exports = { addAgent, addAgentGroup, addOrigin };
