// Your schema's structure should support the actions that your clients will take. our example app needs to be able to:
/**
 * * Fetch a list of all upcoming rocket launches
 * * Fetch a specific launch by it's ID
 * * Log in the user
 * * Book a launch for the logged-in user
 * * Cancel a previously booked launch for a logged-in user
 */

/**
 * !important - Because the schema sits directly between your application clients and your underlying data services,
 * !            frontend and backend teams should collaborate on its structure.
 * !            When you develop your own graph, practice schema-first development and agree on a schema
 * !            before you begin implementing your API.
 **/

const { gql } = require('apollo-server');

// The language to write schema is GraphQL's schema definition language (SDL)
// A fields type can either be an object type or scalar type. You can also define custom scalar types
// [Array]! - array cannot be null but can be empty

const typeDefs = gql`
  type Launch {
    id: ID!
    site: String
    mission: Mission
    rocket: Rocket
    isBooked: Boolean!
  }

  type Rocket {
    id: ID!
    name: String
    type: String
    foo: String
  }

  type User {
    id: ID!
    email: String!
    trips: [Launch]!
    token: String
  }

  type Mission {
    name: String
    missionPatch(size: PatchSize): String
  }

  enum PatchSize {
    SMALL
    LARGE
  }

  type Query {
    allLaunches: [Launch]! # All launches - slow, pagination would be better
    launches(
      pageSize: Int # Must be >=1. Default = 20
      after: String # If cursor, it will only return results _after_ this cursor
    ): LaunchConnection!
    launch(id: ID!): Launch # Launch by ID
    me: User # User currently logged in
  }

  type LaunchConnection { # Wrapper around list of launches with cursor to the last item
    cursor: String! # Pass the cursor to the launches query to fetch results after these.
    hasMore: Boolean! # Whether data set has any more items beyond launches
    launches: [Launch]!
  }

  type Mutation {
    bookTrips(launchIds: [ID]!): TripUpdateResponse! #enables logged in user to book a trip on one or more launch/es
    cancelTrip(launchId: ID!): TripUpdateResponse! #enames logged-in user to cancel a trip they've booked
    login(email: String): User # enables a user to log in with email
  }

  type TripUpdateResponse { #entirely up to you but define special response for mutations
    success: Boolean!
    message: String
    launches: [Launch] #launch/es that were modified by the mutation. Good practice to return whatever was modified so no follow-up query
  }
`;

module.exports = typeDefs;
