const { expect } = require("chai");
const { login } = require("../utils");
const aclClient = require("../index");

const resource = "https://lalatest.solidcommunity.net/profile/.acl";
const acl = new aclClient(resource);

const testOrigins = [
  {
    name: "https://drive.owntech.io/",
    type: "Origin",
    access: ["Read", "Write"],
  },
  {
    name: "https://drive.owntech.io/",
    type: "Origin",
    access: ["Read"],
  },
];

describe("adding an Origin", () => {
  before("Setting up auth...", async function () {
    this.timeout(5000);
    return login().then((nodeClient) => {
      acl.fetcher._fetch = nodeClient.session.fetch.bind(nodeClient);
    });
  });

  describe("addOrigin()", () => {
    it("adds origins with the specified access", () => {
      accesseesToMatch = [
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalatest.solidcommunity.net/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"],
        },
        {
          name: "https://lalatest.solidcommunity.net/profile/card#me",
          type: "Agent",
          identifier:
            "https://lalatest.solidcommunity.net/profile/.acl#ControlReadWrite",
          access: [
            "http://www.w3.org/ns/auth/acl#Control",
            "http://www.w3.org/ns/auth/acl#Read",
            "http://www.w3.org/ns/auth/acl#Write",
          ],
        },
        testOrigins[0],
      ];
      return acl.addOrigin(testOrigins[0]).then(() => {
        return acl.readAccessControl({ force: true }).then((accessees) => {
          return expect(accessees).to.deep.equal(accesseesToMatch);
        });
      });
    });

    it("adds origins and deletes old Access", () => {
      accesseesToMatch = [
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalatest.solidcommunity.net/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"],
        },
        {
          name: "https://lalatest.solidcommunity.net/profile/card#me",
          type: "Agent",
          identifier:
            "https://lalatest.solidcommunity.net/profile/.acl#ControlReadWrite",
          access: [
            "http://www.w3.org/ns/auth/acl#Control",
            "http://www.w3.org/ns/auth/acl#Read",
            "http://www.w3.org/ns/auth/acl#Write",
          ],
        },
        testOrigins[1],
      ];
      return acl.addOrigin(testOrigins[1]).then(() => {
        return acl.readAccessControl({ force: true }).then((accessees) => {
          return expect(accessees).to.deep.equal(accesseesToMatch);
        });
      });
    });
  });

  after("Cleaning up...", () => {
    return acl.deleteOrigin(testOrigins[0].name);
  });
});
