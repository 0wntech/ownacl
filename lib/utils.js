const rdf = require("rdflib");
const ns = require("solid-namespace")(rdf);

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

module.exports = {
  getIdentifier
};
