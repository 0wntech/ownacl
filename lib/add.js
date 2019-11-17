const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const url = require("url");
const { getIdentifier } = require("./utils.js");

function addAgent(agent) {
  agent = makeAgent(agent);
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
  agentGroup = makeAgent(agentGroup, { agentGroup: true });
  return addAgent(agentGroup);
}

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
  if (agentUrl.protocol !== "https:" || !agentUrl.host || !agentUrl.path) {
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
  access.map(accessMode => {
    if (Object.keys(accessModes).lastIndexOf(accessMode) !== -1) {
      return accessModes[accessMode];
    } else if (Object.values(accessModes).lastIndexOf(accessMode) !== -1) {
      return accessMode;
    } else {
      throwError("The specified access is invalid. Received: " + accessMode);
    }
  });
  return access;
}

function throwError(error) {
  throw new Error(error);
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
