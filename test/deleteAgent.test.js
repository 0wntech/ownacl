const { expect } = require("chai");
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const fs = require("fs");
const aclClient = require("../index");

const resource = "https://lalasepp1.solid.community/profile/.acl";
const acl = new aclClient(resource);
let originalState = null;
const testAgents = [
  {
    name: "https://ludwig.owntech.de/profile/card#me",
    type: "Agent",
    access: [
      "http://www.w3.org/ns/auth/acl#Read",
      "http://www.w3.org/ns/auth/acl#Write"
    ]
  },
  {
    name: "https://bejow.owntech.de/profile/card#me",
    type: "Agent",
    access: ["http://www.w3.org/ns/auth/acl#Read"]
  }
];

describe("deleting an Agent", () => {
  before("Setting up auth...", async function() {
    this.timeout(5000);
    return auth.getCredentials().then(credentials => {
      return auth.login(credentials).then(() => {
        acl.fetcher = new rdf.Fetcher(acl.graph, {
          fetch: auth.fetch
        });
        return acl
          .readAgentsAndAccess()
          .then(agents => {
            originalState = agents;
          })
          .then(() => {
            return acl.addAgent(testAgents[0]);
          });
      });
    });
  });

  describe("deleteAgent()", () => {
    it("deletes an agent", () => {
      return acl
        .deleteAgent({ name: "https://ludwig.owntech.de/profile/card#me" })
        .then(() => {
          return acl.readAgentsAndAccess().then(agents => {
            return expect(agents).to.deep.equal(originalState);
          });
        });
    });

    it("deletes an agent from an existing identifier", () => {
      return acl.addAgent(testAgents[1]).then(() => {
        return acl
          .deleteAgent("https://bejow.owntech.de/profile/card#me")
          .then(() => {
            return acl.readAgentsAndAccess().then(agents => {
              return expect(agents).to.deep.equal(originalState);
            });
          });
      });
    });
  });
});
