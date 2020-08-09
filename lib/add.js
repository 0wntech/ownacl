const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const {
  getIdentifier,
  getAgentPredicate,
  getExistingAccess,
  makeEntity,
} = require("./utils.js");

const defaultOptions = { triplesOnly: false, debug: false };

function addAgent(agent, options = defaultOptions) {
  agent = makeEntity(agent);
  return addEntity(agent, this, options);
}

function addAgentGroup(agentGroup, options = defaultOptions) {
  agentGroup = makeEntity(agentGroup, { agentGroup: true });
  return addEntity(agentGroup, this, options);
}

function addOrigin(origin, options = defaultOptions) {
  origin = makeEntity(origin, { origin: true });
  return addEntity(origin, this, options);
}

async function addEntity(
  entity,
  client,
  { debug, triplesOnly } = defaultOptions
) {
  const accessees = await client.readAccessControl({ force: true });
  entity.identifier = getIdentifier(entity, accessees, client.aclResource);
  let del = getExistingAccess(client.graph, entity);
  let ins = makeNewAccessTriples(client.graph, entity);
  if (debug) {
    console.log("Statements to delete: \n");
    console.log(del);
    console.log("\nStatements to insert: \n");
    console.log(ins);
  }

  if (!triplesOnly) {
    if (
      client.defaultAclResource &&
      client.defaultAclResource !== client.aclResource
    ) {
      console.log(
        "Overriding default configuration...",
        client.defaultAclResource
      );
      const newAclStore = rdf.graph();
      accessees.forEach((entity) => {
        entity.identifier = getIdentifier(
          entity,
          accessees,
          client.aclResource
        );
        newAclStore.add(makeTriplesForIdentifier(entity));
      });
      await client.fetcher
        .webOperation("PUT", client.aclResource, {
          headers: {
            link: '<http://www.w3.org/ns/ldp#Resource>; rel="type"',
          },
          body: newAclStore.toNT(),
          contentType: "text/turtle",
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });
      return await addEntity(entity, client);
    } else {
      return await client.updater.update(del, ins);
    }
  } else {
    return ins;
  }
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
  const isFile = !entity.identifier.split("#")[0].endsWith("/.acl");
  const accessedResourceTriples = isFile
    ? [
        rdf.st(
          rdf.sym(entity.identifier),
          ns.acl("accessTo"),
          rdf.sym(
            entity.identifier.substr(0, entity.identifier.lastIndexOf(".acl#"))
          ),
          rdf.sym(entity.identifier).doc()
        ),
      ]
    : [
        rdf.st(
          rdf.sym(entity.identifier),
          ns.acl("accessTo"),
          rdf.sym(
            entity.identifier.substr(0, entity.identifier.lastIndexOf("/") + 1)
          ),
          rdf.sym(entity.identifier).doc()
        ),
        rdf.st(
          rdf.sym(entity.identifier),
          ns.acl("default"),
          rdf.sym(
            entity.identifier.substr(0, entity.identifier.lastIndexOf("/") + 1)
          ),
          rdf.sym(entity.identifier).doc()
        ),
      ];
  return [
    rdf.st(
      rdf.sym(entity.identifier),
      ns.rdf("type"),
      ns.acl("Authorization"),
      rdf.sym(entity.identifier).doc()
    ),
    ...accessedResourceTriples,
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
