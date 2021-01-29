const { expect } = require("chai");
const { login } = require("../utils");
const aclClient = require("../index");

const resource = "https://lalatest.solidcommunity.net/profile/.acl";
const acl = new aclClient(resource);
let originalState = null;
const testAgentGroups = [
  {
    name: "http://xmlns.com/foaf/0.1/Account",
    type: "AgentGroup",
    access: [
      "http://www.w3.org/ns/auth/acl#Read",
      "http://www.w3.org/ns/auth/acl#Write",
    ],
  },
  {
    name: "http://www.w3.org/ns/solid/terms#Account",
    type: "AgentGroup",
    access: ["http://www.w3.org/ns/auth/acl#Read"],
  },
];

describe("deleting an AgentGroup", () => {
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
          return acl.addAgentGroup(testAgentGroups[0]);
        });
    });
  });

  describe("deleteAgentGroup()", () => {
    it("deletes an agent group", () => {
      return acl
        .deleteAgentGroup({ name: testAgentGroups[0].name })
        .then(() => {
          return acl.readAccessControl({ force: true }).then((agents) => {
            return expect(agents).to.deep.equal(originalState);
          });
        });
    });

    it("deletes an agent group from an existing identifier", () => {
      return acl.addAgentGroup(testAgentGroups[1]).then(() => {
        return acl
          .deleteAgentGroup(testAgentGroups[1].name, {
            debug: true,
          })
          .then(() => {
            return acl.readAccessControl({ force: true }).then((agents) => {
              return expect(agents).to.deep.equal(originalState);
            });
          });
      });
    });
  });
});
