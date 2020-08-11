# ownacl

A library to make managing file permissions in solid pods easier. 

If you are unfamiliar with the Solid Project, [this](https://solid.mit.edu/) is a good first read. 
This library is intended for acl files that were created in accordance with the [WAC](https://www.w3.org/wiki/WebAccessControl) standards.
All the functionality was implemented on top of the [rdflib.js](https://github.com/linkeddata/rdflib.js) library.

[Features](#Features) | [Usage](#Usage) | [Installing](#Installing) | [Contributing](#Contributing)

## Features

At the moment the library supports the following functionality:
* Reading permissions
* Adding permissions
* Deleting permissions

Features that are planned for the future as of right now include:
* Add Access Groups with member
* Support a local mode that only updates a local graph

## Usage

The acl client object needs to be instantiated with the url of the access control file that is supposed to be read (In this example it would be the acl file for the root folder):
```javascript
import aclClient from 'ownacl'
const acl = new aclClient("https://bob.solid.community/.acl")
```

Every function of this object will return a [promise](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Promise) that needs to be awaited.


### Reading Permissions

To **read all agents and their access** use `readAgentsAndAccess()`:
```javascript
acl.readAgentsAndAccess().then((agentsAndAccess) => {
   // do something with the results in here
})
```
The result would look something like this:
```
[{
  'name': 'https://bob.solid.community/profile/card#me',
  'identifier': 'https://bob.solid.community/.acl#owner'
  'type': 'Agent',
  'access': ['Control', 'Read', 'Write']
}, ...]
```

To **read all agents** that are mentioned in the file use `readAgents()`:
```javascript
acl.readAgents().then((agents) => {
   // do something with the results in here
})
```
The result would look something like this:
```
[{
  'name': 'https://bob.solid.community/profile/card#me',
  'identifier': 'https://bob.solid.community/.acl#owner'
  'type': 'Agent',
}, ...]
```

The resulting array of agents and the identifier property of each agent object can be used with `readAccess(identifier)` to get the access of a single agent. 
The same can be done with AgentGroups or Origins by using `readAgentGroups()` or `readOrigins()`.

### Adding or removing permissions

To **add permissions** for some agent you can use `addAgent(agent)`. 
You'll need to pass an object containing a valid [webId](https://www.w3.org/2005/Incubator/webid/spec/identity/) in a name property and an access property that contains the permissions you want to give:
```javascript
const alice = { name: 'https://alice.solid.community/profile/card#me', access: ['Read', 'Write'] }
acl.addAgent(alice).then(() => {
  // Alice has been added
  ...
})
```

The same can be done for AgentGroups or Origins by using `addAgentGroup(agentGroup)` or `addOrigin(origin)` and by passing an AgentGroup or Origin object.
If there is an Agent, an AgentGroup or an Origin that already has the access the new agent is supposed to have, they will share an identifier.

To **remove permissions** for an agent you'll need to pass an object with just the agents name to `deleteAgent(agent)`:
```javascript
const alice = { name: 'https://alice.solid.community/profile/card#me' }
acl.deleteAgent(alice).then(() => {
  // alice's permissions have been removed
  ...
})
```

The same can be done for AgentGroups and Origins by using `deleteAgentGroup(agentGroup)` or `deleteOrigin(origin)`.

## Installing

The library can be installed with the npm package manager by running `npm install ownacl`. It can be used for both a node environment (at least v12.0) and a browser environment.

## Contributing

(0. Create an issue)
1. Create a Pull Request, in which you link to an issue or explain why this change was necessary
2. Run the tests and or write a test for the feature. Explain how this feature can be tested in your PR description when you are done
3. Assign a reviewer
4. After your code was reviewed, apply the changes that may be requested from the reviewer
5. Then after your PR has been approved, squash and merge the PR with a senseful commit message in the format of '[Feature that you worked on]: [What you did exactly]' e.g. 'Updating permissions: Refactor util functions'

### Running the tests

You'll need to install and setup the solid-auth-cli package to authenticate from the command line, instructions can be found [here](https://github.com/jeff-zucker/solid-auth-cli). 
Then you can run the tests by running `npm test`.
