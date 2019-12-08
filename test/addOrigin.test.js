const { expect } = require("chai");
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const aclClient = require("../index");

const resource = "https://lalasepp1.solid.community/profile/.acl";
const acl = new aclClient(resource);

const testOrigins = [
  {
    name: "https://drive.owntech.io/",
    type: "Origin",
    access: ["Read", "Write"]
  },
  {
    name: "https://drive.owntech.io/",
    type: "Origin",
    access: ["Read"]
  }
];

describe("adding an Origin", () => {
  before("Setting up auth...", async function() {
    this.timeout(5000);
    return auth.getCredentials().then(credentials => {
      return auth.login(credentials).then(() => {
        acl.fetcher = new rdf.Fetcher(acl.graph, {
          fetch: auth.fetch
        });
      });
    });
  });

  describe("addOrigin()", () => {
    it("adds origins with the specified access", () => {
      accesseesToMatch = [
        {
          name: "https://lalasepp1.solid.community/profile/card#me",
          type: "Agent",
          identifier:
            "https://lalasepp1.solid.community/profile/.acl#ControlReadWrite",
          access: [
            "http://www.w3.org/ns/auth/acl#Control",
            "http://www.w3.org/ns/auth/acl#Read",
            "http://www.w3.org/ns/auth/acl#Write"
          ]
        },
        testOrigins[0],
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalasepp1.solid.community/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"]
        }
      ];
      return acl.addOrigin(testOrigins[0]).then(() => {
        return acl.readAccessControl({ force: true }).then(accessees => {
          return expect(accessees).to.deep.equal(accesseesToMatch);
        });
      });
    });

    it("adds origins and deletes old Access", () => {
      accesseesToMatch = [
        {
          name: "https://lalasepp1.solid.community/profile/card#me",
          type: "Agent",
          identifier:
            "https://lalasepp1.solid.community/profile/.acl#ControlReadWrite",
          access: [
            "http://www.w3.org/ns/auth/acl#Control",
            "http://www.w3.org/ns/auth/acl#Read",
            "http://www.w3.org/ns/auth/acl#Write"
          ]
        },
        testOrigins[1],
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalasepp1.solid.community/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"]
        }
      ];
      return acl.addOrigin(testOrigins[1]).then(() => {
        return acl.readAccessControl({ force: true }).then(accessees => {
          return expect(accessees).to.deep.equal(accesseesToMatch);
        });
      });
    });
  });

  after("Cleaning up...", () => {
    return acl.deleteOrigin(testOrigins[0].name);
  });
});
