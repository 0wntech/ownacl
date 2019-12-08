const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const url = require("url");

function makeEntity(entity, options = {}) {
  if (typeof entity !== "object") {
    throwError(
      "The specified entity needs to be an object. Received: " + typeof entity
    );
  }

  if (!entity.name) {
    throwError("The specified entity doesn't have a name property");
  }

  const agentUrl = url.parse(entity.name);
  if (
    (agentUrl.protocol !== "https:" && agentUrl.protocol !== "http:") ||
    !agentUrl.host ||
    !agentUrl.path
  ) {
    throwError(
      "Please specify a valid url in the name property of the specified entity. Received: " +
        entity.name
    );
  }

  entity.type = makeType(entity, options);
  entity.access = makeAccess(entity.access);
  return entity;
}

function makeType(entity, options) {
  const agentUrl = url.parse(entity.name);
  const validTypes = ["Origin", "AgentGroup", "Agent"];
  if (validTypes.lastIndexOf(entity.type) === -1) {
    entity.type = "Agent";
  }

  if (options.agentGroup) {
    entity.type = "AgentGroup";
  } else if (options.origin) {
    entity.type = "Origin";
  }

  if (entity.type === "Agent") {
    if (agentUrl.path !== "/profile/card") {
      throwError(
        "Please specify a valid webId in the name property of the specified entity. Received: " +
          entity.name
      );
    }
  }
  return entity.type;
}

function makeAccess(access) {
  if (typeof access === "string") access = [access];
  const accessModes = {
    Read: "http://www.w3.org/ns/auth/acl#Read",
    Write: "http://www.w3.org/ns/auth/acl#Write",
    Control: "http://www.w3.org/ns/auth/acl#Control",
    Append: "http://www.w3.org/ns/auth/acl#Append"
  };
  return access.map(accessMode => {
    if (Object.keys(accessModes).lastIndexOf(accessMode) !== -1)
      return accessModes[accessMode];
    if (Object.values(accessModes).lastIndexOf(accessMode) !== -1)
      return accessMode;

    throwError(
      "The specified access is invalid. Received: " +
        accessMode +
        "\nValid types include: " +
        Object.keys(accessModes)
    );
  });
}

function getIdentifier(entity, accessees, resource) {
  let identifier;
  accessees = accessees.filter(accessee => {
    return JSON.stringify(accessee.access) === JSON.stringify(entity.access);
  });
  if (accessees.length > 0) {
    identifier = entity.identifier ? entity.identifier : accessees[0].identifier;
  } else {
    identifier =
      resource +
      "#" +
      entity.access
        .map(access => access.split("#")[1])
        .sort()
        .join("");
  }
  return identifier;
}

function getExistingAccess(store, entity, options = {}) {
  const agentPredicate = getAgentPredicate(entity);
  if (store.any(null, agentPredicate, rdf.sym(entity.name))) {
    const currIdentifiers = store
      .statementsMatching(null, agentPredicate, rdf.sym(entity.name))
      .map(statement => {
        return statement.subject.value;
      });

    if (currIdentifiers.length > 1) {
      let triples = [];
      currIdentifiers.forEach(identifier => {
        if (options.force || identifier !== entity.identifier)
          triples = triples.concat(
            getExistingAccessTriples(store, entity, identifier)
          );
      });
      return triples;
    } else {
      if (options.force || currIdentifiers[0] !== entity.identifier)
        return getExistingAccessTriples(store, entity, currIdentifiers[0]);
    }
  }
  return [];
}

function getExistingAccessTriples(store, entity, identifier) {
  const agentPredicate = getAgentPredicate(entity);
  const agentsOfIdentifier = getAgentsOfIdentifier(store, identifier);
  if (
    JSON.stringify(agentsOfIdentifier) ===
    JSON.stringify(
      store.statementsMatching(
        rdf.sym(identifier),
        agentPredicate,
        rdf.sym(entity.name)
      )
    )
  ) {
    console.log("Deleting a whole access class...");
    return store.statementsMatching(rdf.sym(identifier));
  } else {
    console.log("Not deleting the whole access class...");
    return store.statementsMatching(
      rdf.sym(identifier),
      agentPredicate,
      rdf.sym(entity.name)
    );
  }
}

function getAgentsOfIdentifier(store, identifier) {
  return store
    .statementsMatching(rdf.sym(identifier), ns.acl("agent"))
    .concat(
      store.statementsMatching(rdf.sym(identifier), ns.acl("agentClass")),
      store.statementsMatching(rdf.sym(identifier), ns.acl("origin"))
    );
}

function getAgentPredicate(entity) {
  return entity.type !== "Origin"
    ? entity.type === "Agent"
      ? ns.acl("agent")
      : ns.acl("agentClass")
    : ns.acl("origin");
}

function throwError(error) {
  throw new Error(error);
}

module.exports = {
  makeEntity,
  getIdentifier,
  getExistingAccess,
  getAgentPredicate,
  throwError
};
