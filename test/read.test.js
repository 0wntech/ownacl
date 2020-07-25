const { expect } = require("chai");
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const fs = require("fs");
const aclClient = require("../index");

const resource = "https://lalasepp1.solid.community/profile/";
const acl = new aclClient(resource);

describe("read", () => {
  before("Setting up auth...", async function() {
    this.timeout(3000);
    return auth.getCredentials().then(credentials => {
      return auth.login(credentials).then(() => {
        acl.fetcher = new rdf.Fetcher(acl.graph, {
          fetch: auth.fetch
        });
      });
    });
  });

  describe("read()", () => {
    it("fetches and reads the resource", () => {
      return acl.read().then(triples => {
        return fs.promises
          .readFile("./test/resources/profile.acl", "utf-8")
          .then(file => {
            expect(triples).to.equal(file);
          });
      });
    });
    
    it("fetches and reads the resource from a default location", () => {
      const acl = new aclClient(resource.replace('profile', 'public'))
      return acl.read().then(triples => {
        return fs.promises
          .readFile("./test/resources/root.acl", "utf-8")
          .then(file => {
            expect(triples).to.equal(file);
          });
      });
    });
  });

  describe("readAccessControl()", () => {
    it("reads and returns agents and their access", () => {
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
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalasepp1.solid.community/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"]
        }
      ];
      return acl.readAccessControl().then(accessees => {
        expect(accessees).to.deep.equal(accesseesToMatch);
      });
    });
  });

  describe("readEntities()", () => {
    it("reads and returns agents", () => {
      agentsToMatch = [
        {
          name: "https://lalasepp1.solid.community/profile/card#me",
          type: "Agent",
          identifier:
            "https://lalasepp1.solid.community/profile/.acl#ControlReadWrite"
        },
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalasepp1.solid.community/profile/.acl#Read"
        }
      ];
      return acl.readEntities().then(agents => {
        expect(agents).to.deep.equal(agentsToMatch);
      });
    });
  });

  describe("readAccess()", () => {
    it("reads and returns the access of an identifier", () => {
      accessToMatch = ["http://www.w3.org/ns/auth/acl#Read"];
      return acl
        .readAccess("https://lalasepp1.solid.community/profile/.acl#Read")
        .then(access => {
          return expect(access).to.deep.equal(accessToMatch);
        });
    });

    it("reads and returns the access of an agent identifier", () => {
      accessToMatch = ["http://www.w3.org/ns/auth/acl#Read"];
      return acl.readAccess("http://xmlns.com/foaf/0.1/Agent").then(access => {
        return expect(access).to.deep.equal(accessToMatch);
      });
    });
  });
});
