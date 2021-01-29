const { expect } = require("chai");
const { login } = require("../utils");
const aclClient = require("../index");

const resource = "https://lalatest.solidcommunity.net/profile/.acl";
const acl = new aclClient(resource);

describe("adding an AgentGroup", () => {
  before("Setting up auth...", async function () {
    this.timeout(5000);
    return login().then((nodeClient) => {
      acl.fetcher._fetch = nodeClient.session.fetch.bind(nodeClient);
    });
  });

  describe("addAgentGroup()", () => {
    it("adds agentGroups with the specified access", () => {
      const agentGroup = {
        name: "http://xmlns.com/foaf/0.1/Agent",
        type: "AgentGroup",
        access: ["Read", "Write"],
      };
      accesseesToMatch = [
        agentGroup,
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
      ];
      return acl.addAgentGroup(agentGroup).then(() => {
        return acl.readAccessControl().then((accessees) => {
          return expect(accessees).to.deep.equal(accesseesToMatch);
        });
      });
    });

    it("adds agentGroups and deletes old Access", () => {
      const agentGroup = {
        name: "http://xmlns.com/foaf/0.1/Agent",
        type: "AgentGroup",
        access: ["Read"],
      };
      accesseesToMatch = [
        agentGroup,
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
      ];
      return acl.addAgentGroup(agentGroup).then(() => {
        return acl.readAccessControl().then((accessees) => {
          return expect(accessees).to.deep.equal(accesseesToMatch);
        });
      });
    });
  });
});
