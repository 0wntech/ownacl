const rdf = require("rdflib");
const urllib = require("url");
const ns = require("solid-namespace")(rdf);
const { throwError, getDefaultAclLocation } = require("./utils.js");

const defaultOptions = { force: false };

async function read({ force } = defaultOptions) {
  this.aclResource = this.resource.endsWith(".acl")
    ? this.resource
    : this.resource + ".acl";
  if (!this.body || force) {
    let aclBody;
    let url = this.aclResource;
    while (!aclBody && url) {
      aclBody = await this.fetcher
        .load(url, { force: true, clearPreviousData: true })
        .then(() => {
          this.body = rdf.serialize(
            rdf.sym(url),
            this.graph,
            this.aclResource,
            "text/turtle"
          );
          console.log("Freshly fetched");
          return this.body;
        })
        .catch((err) => {
          const aclUrlObject = urllib.parse(url);
          if (aclUrlObject.pathname !== "/.acl" && err.status === 404) {
            url = getDefaultAclLocation(url);
          } else if (err.status === 403) {
            throwError(`Reading ${url} - Required access modes not granted`);
          } else {
            throwError(`Reading ${url} - Bad Request or Unauthenticated`);
          }
          return undefined;
        });
    }
    if (this.aclResource !== url) {
      this.defaultAclResource = url;
    } else {
      this.defaultAclResource = undefined;
    }
    return aclBody;
  } else {
    return this.body;
  }
}

function readAccessControl(options = defaultOptions) {
  return this.read(options).then(() => {
    return this.readEntities().then((entities) => {
      entities.map((entity) => {
        return this.readAccess(entity.name).then((access) => {
          entity.access = access;
          return entity;
        });
      });
      return entities;
    });
  });
}

function readAccess(identifier, options = defaultOptions) {
  return this.read(options).then(() => {
    if (identifier.split("#")[0] === this.aclResource)
      return this.graph
        .each(rdf.sym(identifier), ns.acl("mode"))
        .map((accessMode) => accessMode.value)
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
      .map((accessMode) => accessMode.value)
      .sort();
  });
}

function readEntities(options = defaultOptions) {
  return this.read(options).then(() => {
    const entities = this.graph
      .statementsMatching(
        null,
        ns.acl("agent"),
        null,
        rdf.sym(
          this.defaultAclResource ? this.defaultAclResource : this.aclResource
        )
      )
      .concat(
        this.graph.statementsMatching(
          null,
          ns.acl("origin"),
          null,
          rdf.sym(
            this.defaultAclResource ? this.defaultAclResource : this.aclResource
          )
        ),
        this.graph.statementsMatching(
          null,
          ns.acl("agentClass"),
          null,
          rdf.sym(
            this.defaultAclResource ? this.defaultAclResource : this.aclResource
          )
        )
      )
      .map((entity) => {
        const type = entity.predicate.value.split("#")[1];
        return {
          name: entity.object.value,
          type:
            type === "agentClass"
              ? "AgentGroup"
              : type.charAt(0).toUpperCase() + type.slice(1),
          identifier: entity.subject.value,
        };
      })
      .filter((entity) => !entity.name.startsWith("mailto:"))
      .sort((entityA, entityB) =>
        entityA.type === "AgentGroup" ? -1 : entityB.type === "AgentGroup" && 1
      );
    return entities;
  });
}

module.exports = {
  read,
  readAccessControl,
  readAccess,
  readEntities,
};
