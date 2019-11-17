const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const { getIdentifier } = require("./utils.js");

function addAgent(agent) {
  return this.readAgentsAndAccess().then(accessees => {
    agent.identifier = getIdentifier(agent, accessees, this.resource);
    let del = [];
    let ins = [];
    const agentPredicate =
      agent.type === "Agent" ? ns.acl("agent") : ns.acl("agentClass");
    if (this.graph.any(null, agentPredicate, rdf.sym(agent.name))) {
      const currIdentifiers = this.graph
        .statementsMatching(null, agentPredicate, rdf.sym(agent.name))
        .map(statement => {
          return statement.subject.value;
        });
      if (currIdentifiers.length > 1) {
        currIdentifiers.forEach(identifier => {
          if (
            this.graph.statementsMatching(rdf.sym(identifier), agentPredicate)
              .length === 1
          ) {
            del = del.concat(
              this.graph.statementsMatching(rdf.sym(identifier))
            );
          } else {
            del = del.concat(
              this.graph.statementsMatching(
                rdf.sym(currIdentifiers[0], agentPredicate, rdf.sym(agent.name))
              )
            );
          }
        });
      } else {
        if (
          this.graph.statementsMatching(
            rdf.sym(currIdentifiers[0]),
            agentPredicate
          ).length === 1
        ) {
          del = del.concat(
            this.graph.statementsMatching(rdf.sym(currIdentifiers[0]))
          );
        } else {
          del = del.concat(
            this.graph.statementsMatching(
              rdf.sym(currIdentifiers[0], agentPredicate, rdf.sym(agent.name))
            )
          );
        }
      }
    }
    if (this.graph.any(rdf.sym(agent.identifier))) {
      ins = rdf.st(
        rdf.sym(agent.identifier),
        agentPredicate,
        rdf.sym(agent.name),
        rdf.sym(agent.identifier).doc()
      );
    } else {
      ins = getTriplesOfAgent(agent);
    }
    return this.updater.update(del, ins).then(() => {
      return this.readAgentsAndAccess();
    });
  });
}

function addAgentGroup(agentGroup) {
  return addAgent(agentGroup);
}

function getTriplesOfAgent(agent) {
  const agentPredicate =
    agent.type === "Agent" ? ns.acl("agent") : ns.acl("agentClass");
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
