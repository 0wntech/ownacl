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

function readAccessControl(options = {}) {
  return this.read(options).then(() => {
    return this.readEntities().then(entities => {
      entities.map(entity => {
        return this.readAccess(entity.identifier).then(access => {
          entity.access = access;
          return entity;
        });
      });
      return entities;
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

function readEntities(options = {}) {
  return this.read(options).then(() => {
    const entities = this.graph
      .statementsMatching(null, ns.acl("agent"), null)
      .concat(
        this.graph.statementsMatching(null, ns.acl("origin")),
        this.graph.statementsMatching(null, ns.acl("agentClass"))
      )
      .map(entity => {
        const type = entity.predicate.value.split("#")[1];
        return {
          name: entity.object.value,
          type:
            type === "agentClass"
              ? "AgentGroup"
              : type.charAt(0).toUpperCase() + type.slice(1),
          identifier: entity.subject.value
        };
      });
    return entities;
  });
}

module.exports = {
  read,
  readAccessControl,
  readAccess,
  readEntities
};
