/**
 * * *** Top level resolvers ***
 *
 * * By providing this resolver map to apollo server, it knows how to call resolver functions as needed to fulfull incoming queries
 * * _ variable = parent, underscore convention to indicate that we don't use this value
 * * __ variable = args, underscore convention to indicate that we don't use this value
 * * { dataSources } variable = context destructured to access dataSources
 * * fourth argument would be info but it is unneeded, contains info about the execution state of the operation (advanced cases)
 * ! By keeping resolvers thin as best practice, you can safely refactor your backing logic while reducing the likelihoos of breaking your API
 **/
const { paginateResults } = require('./utils');

module.exports = {
  Query: {
    launches: async (_, { pageSize = 20, after }, { dataSources }) => {
      const allLaunches = await dataSources.launchAPI.getAllLaunches();
      // we want these in reverse chronological order
      allLaunches.reverse();

      // TODO: Investigate and understand the mechanics of this function
      const launches = paginateResults({
        after,
        pageSize,
        results: allLaunches,
      });

      return {
        launches,
        cursor: launches.length ? launches[launches.length - 1].cursor : null,
        // if the cursor at the end of the paginated results is the same as the
        // last item in _all_ results, then there are no more results after this
        hasMore: launches.length
          ? launches[launches.length - 1].cursor !== allLaunches[allLaunches.length - 1].cursor
          : false,
      };
    },
    launch: (_, { id }, { dataSources }) => dataSources.launchAPI.getLaunchById({ launchId: id }),
    me: (_, __, { dataSources }) => dataSources.userAPI.findOrCreateUser(),
  },
  Mutation: {
    login: async (_, { email }, { dataSources }) => {
      const user = await dataSources.userAPI.findOrCreateUser({ email });
      if (user) {
        user.token = Buffer.from(email).toString('base64'); // represents the users active session - not secure
      }
      return user;
    },
    bookTrips: async (_, { launchIds }, { dataSources }) => {
      const results = await dataSources.userAPI.bookTrips({ launchIds });
      const launches = await dataSources.launchAPI.getLaunchesByIds({ launchIds });

      return {
        success: results && results.length === launchIds.length,
        message:
          results.length === launchIds.length
            ? 'trips booked successfully'
            : `the following launches couldn't be booked ${launchIds.filter((id) => !results.includes(id))}`, // indicates a partial success
        launches,
      };
    },
    cancelTrip: async (_, { launchId }, { dataSources }) => {
      const launch = await dataSources.userAPI.cancelTrip({ launchId });
      return {
        success: true,
        message: 'trip cancelled',
        launches: [launch],
      };
    },
  },
  Mission: {
    missionPatch: (mission, { size } = { size: 'LARGE' }) => {
      return size === 'SMALL' ? mission.missionPatchSmall : mission.missionPatchLarge;
    },
  },
  Launch: {
    isBooked: async (launch, __, { dataSources }) => {
      // * Determines whether the logged-in user has booked a trip on a particular launch, returns true/false
      dataSources.userAPI.isBookedOnLaunch({ launchId: launch.id });
    },
  },
  User: {
    trips: async (_, __, { dataSources }) => {
      // * get ids of launches by user
      // ! our server currently doesn't know the current user!
      const launchIds = await dataSources.userAPI.getLaunchIdsByUser();

      // * look up those launches by their ids
      return (
        dataSources.launchAPI.getLaunchesByIds({
          launchIds,
        }) || []
      );
    },
  },
};
