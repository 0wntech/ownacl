const { expect } = require("chai");
const { login } = require("../utils");
const rdf = require("rdflib");
const aclClient = require("../index");

const resource = "https://lalatest.solidcommunity.net/profile/.acl";
const acl = new aclClient(resource);
let originalState = null;
const testAgents = [
  {
    name: "https://ludwig.aws.owntech.de/profile/card#me",
    type: "Agent",
    access: [
      "http://www.w3.org/ns/auth/acl#Read",
      "http://www.w3.org/ns/auth/acl#Write",
    ],
  },
  {
    name: "https://bejow.owntech.de/profile/card#me",
    type: "Agent",
    access: ["http://www.w3.org/ns/auth/acl#Read"],
  },
];

describe("deleting an Agent", () => {
  before("Setting up auth...", async function () {
    this.timeout(5000);
    return login().then((nodeClient) => {
      acl.fetcher._fetch = nodeClient.session.fetch.bind(nodeClient);
      return acl
        .readAccessControl()
        .then((agents) => {
          originalState = agents;
        })
        .then(() => {
          return acl.addAgent(testAgents[0]);
        });
    });
  });

  describe("deleteAgent()", () => {
    it("deletes an agent", () => {
      return acl
        .deleteAgent({ name: "https://ludwig.aws.owntech.de/profile/card#me" })
        .then(() => {
          return acl.readAccessControl().then((agents) => {
            return expect(agents).to.deep.equal(originalState);
          });
        });
    });

    it("deletes an agent from an existing identifier", () => {
      return acl.addAgent(testAgents[1]).then(() => {
        return acl
          .deleteAgent("https://bejow.owntech.de/profile/card#me")
          .then(() => {
            return acl.readAccessControl().then((agents) => {
              return expect(agents).to.deep.equal(originalState);
            });
          });
      });
    });
  });
});
