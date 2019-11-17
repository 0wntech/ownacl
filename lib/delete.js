const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);
const { getIdentifier } = require("./utils.js");

function deleteAgent(agent) {
  return this.readAgentsAndAccess().then(accessees => {
    agent.identifier = getIdentifier(agent, accessees, this.resource);
    let del = this.graph.statementsMatching(rdf.sym(agent.identifier));
    if (
      this.graph
        .statementsMatching(rdf.sym(agent.identifier), ns.acl("agent"))
        .concat(
          this.graph.statementsMatching(
            rdf.sym(agent.identifier),
            ns.acl("agentClass")
          )
        ).length > 1
    ) {
      del = this.graph.statementsMatching(
        rdf.sym(agent.identifier),
        agent.type === "Agent" ? ns.acl("agent") : ns.acl("agentClass"),
        rdf.sym(agent.name)
      );
    }
    const ins = [];
    return this.updater.update(del, ins).then(() => {
      return this.readAgentsAndAccess();
    });
  });
}

module.exports = { deleteAgent };
