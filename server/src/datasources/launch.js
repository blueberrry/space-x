/**
 * * Apollo provides DataSource class.
 * * We can connect REST API and SQL dbs to apollo server
 * * The RESTDataSource class automatically caches responses
 * * from REST resources without any additional setup
 *        ! this feature is called partial query caching
 * * RESTDataSource class provides helper methods like
 *        ! this.get this.post
 * * launchReducer method tranforms each returned launch into the
 * * formate expected by our schema, else []
 **/

const { RESTDataSource } = require('apollo-datasource-rest');

class LaunchAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'https://api.spacexdata.com/v2/';
  }

  launchReducer(launch) {
    return {
      id: launch.flight_number || 0,
      cursor: `${launch.launch_date_unix}`,
      site: launch.launch_site && launch.launch_site.site_name,
      mission: {
        name: launch.mission_name,
        missionPatchSmall: launch.links.mission_patch_small,
        missionPatchLarge: launch.links.mission_patch,
      },
      rocket: {
        id: launch.rocket.rocket_id,
        name: launch.rocket.rocket_name,
        type: launch.rocket.rocket_type,
      },
    };
  }

  async getAllLaunches() {
    const response = await this.get('launches');
    if (Array.isArray(response)) {
      // * using a reducer like this enables getAllLaunches method to remain
      // * consise as our definition of Launch changes over time.
      // * it will help with testing our LaunchAPI class
      return response.map((launch) => this.launchReducer(launch));
    } else {
      return [];
    }
  }

  async getLaunchById({ launchId }) {
    const response = await this.get('launches', { flight_number: launchId });
    return this.launchReducer(response[0]);
  }

  getLaunchesByIds({ launchIds }) {
    // * returns result of multiple calls to getLaunchById
    return Promise.all(launchIds.map((launchId) => this.getLaunchById({ launchId })));
  }
}

module.exports = LaunchAPI;
