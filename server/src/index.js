require('dotenv').config();

const isEmail = require('isemail');

const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const { createStore } = require('./utils');
const resolvers = require('./resolvers');

const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');

const store = createStore(); // * set up our SQLite db

const server = new ApolloServer({
  // * By creating this context object at the beginning of each operation's excecution,
  // * all of our resolvers can access the details for the logged-in user and perform
  // * actions specifically for that user.
  context: async ({ req }) => {
    // * simple auth check on every request (for every GraphQL operation that clients send to our server
    // * this is _not secure_ but priciples demonstrated below could be used with a secure token-based authentication method
    const auth = (req.headers && req.headers.authorization) || '';
    const email = Buffer.from(auth, 'base64').toString('ascii');

    // ! if buffer not valid email, return null
    if (!isEmail.validate(email)) return { user: null };

    // * find a or create user by their email
    const users = await store.users.findOrCreate({ where: { email } });
    const user = (users && users[0]) || null;

    // * The return function becomesthe context argument that's passed to every resolver
    return { user: { ...user.dataValues } };
  },
  typeDefs,
  resolvers,
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store }),
  }),
});

/**
 * ! if using this.context in a datasource, it's critical to create a _new_ instance
 * ! otherwise intialize might be called during the execution
 * ! of async code for a particular user, replacing this.context with the context
 * ! of another user
 **/

server.listen().then(() => {
  console.log(`
    Server is running!
    Listening on port 4000
    Explore at https://studio.apollographql.com/sandbox
  `);
});
