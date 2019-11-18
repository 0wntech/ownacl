const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const url = require("url");

function makeAgent(agent, options = {}) {
  if (typeof agent !== "object") {
    throwError(
      "The specified agent needs to be an object. Received: " + typeof agent
    );
  }

  if (!agent.name) {
    throwError("The specified agent doesn't have a name property");
  }

  const agentUrl = url.parse(agent.name);
  if (
    (agentUrl.protocol !== "https:" && agentUrl.protocol !== "http:") ||
    !agentUrl.host ||
    !agentUrl.path
  ) {
    throwError(
      "Please specify a valid url in the name property of the specified agent. Received: " +
        agent.name
    );
  }

  agent.type = makeType(agent, options);
  agent.access = makeAccess(agent.access);
  return agent;
}

function makeType(agent, options) {
  const agentUrl = url.parse(agent.name);
  const validTypes = ["Origin", "AgentGroup", "Agent"];
  if (validTypes.lastIndexOf(agent.type) === -1) {
    return "Agent";
  }

  if (options.agentGroup) {
    agent.type = "AgentGroup";
  } else if (options.origin) {
    agent.type = "Origin";
  }

  if (agent.type === "Agent") {
    if (agentUrl.path !== "/profile/card") {
      throwError(
        "Please specify a valid webId in the name property of the specified agent. Received: " +
          agent.name
      );
    }
  }
  return agent.type;
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

function getIdentifier(agent, accessees, resource) {
  let identifier;
  accessees = accessees.filter(accessee => {
    return JSON.stringify(accessee.access) === JSON.stringify(agent.access);
  });
  if (accessees.length > 0) {
    identifier = agent.identifier ? agent.identifier : accessees[0].identifier;
  } else {
    identifier =
      resource +
      "#" +
      agent.access
        .map(access => access.split("#")[1])
        .sort()
        .join("");
  }
  return identifier;
}

function getExistingAccess(store, agent, options = {}) {
  const agentPredicate = getAgentPredicate(agent);
  if (store.any(null, agentPredicate, rdf.sym(agent.name))) {
    const currIdentifiers = store
      .statementsMatching(null, agentPredicate, rdf.sym(agent.name))
      .map(statement => {
        return statement.subject.value;
      });

    if (currIdentifiers.length > 1) {
      let triples = [];
      currIdentifiers.forEach(identifier => {
        if (options.force || identifier !== agent.identifier)
          triples = triples.concat(
            getExistingAccessTriples(store, agent, identifier)
          );
      });
      return triples;
    } else {
      if (options.force || currIdentifiers[0] !== agent.identifier)
        return getExistingAccessTriples(store, agent, currIdentifiers[0]);
    }
  }
  return [];
}

function getExistingAccessTriples(store, agent, identifier) {
  const agentPredicate = getAgentPredicate(agent);
  const agentsOfIdentifier = getAgentsOfIdentifier(store, identifier);
  if (
    JSON.stringify(agentsOfIdentifier) ===
    JSON.stringify(
      store.statementsMatching(
        rdf.sym(identifier),
        agentPredicate,
        rdf.sym(agent.name)
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
      rdf.sym(agent.name)
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

function getAgentPredicate(agent) {
  return agent.type !== "Origin"
    ? agent.type === "Agent"
      ? ns.acl("agent")
      : ns.acl("agentClass")
    : ns.acl("origin");
}

function throwError(error) {
  throw new Error(error);
}

module.exports = {
  makeAgent,
  getIdentifier,
  getExistingAccess,
  getAgentPredicate
};
