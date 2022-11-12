import React, { Fragment, useState } from 'react';
import { RouteComponentProps } from '@reach/router';
import { gql, useQuery } from '@apollo/client';
import { LaunchTile, Header, Button, Loading } from '../components';
// also import the necessary types that are generated from your server's schema definitions:
import * as GetLaunchListTypes from './__generated__/GetLaunchList';

export const LAUNCH_TILE_DATA = gql`
  # A fragment is useful for defining a set of fields that you can include across multiple queries without rewruiting them
  fragment LaunchTile on Launch {
    __typename
    id
    isBooked
    rocket {
      id
      name
    }
    mission {
      name
      missionPatch
    }
  }
`;

export const GET_LAUNCHES = gql`
  query GetLaunchList($after: String) {
    launches(after: $after) {
      cursor # We can execute the query again and provide our most recent cursor as the value of the $after variable to fetch the next set of launches in the list.
      hasMore
      launches {
        ...LaunchTile
      }
    }
  }
  ${LAUNCH_TILE_DATA}
`;

interface LaunchesProps extends RouteComponentProps {}

const Launches: React.FC<LaunchesProps> = () => {
  const { data, loading, error, fetchMore } = useQuery<
    GetLaunchListTypes.GetLaunchList,
    GetLaunchListTypes.GetLaunchListVariables
  >(GET_LAUNCHES);

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  if (loading) return <Loading />; // TODO: Investigate ts jsx error
  if (error) return <p>ERROR</p>;
  if (!data) return <p>Not found</p>;

  const handleLoadMorePress = async () => {
    setIsLoadingMore(true);
    await fetchMore({
      variables: {
        after: data.launches.cursor,
      },
    });
    setIsLoadingMore(false);
  };
  

  return (
    <Fragment>
      <Header />
      {data?.launches &&
        data.launches.launches &&
        data.launches.launches.map((launch: any) => {
          return <LaunchTile key={launch.id} launch={launch} />;
        })}
      {data.launches &&
        data.launches.hasMore &&
        (isLoadingMore ? <p>Loading</p> : <Button onClick={handleLoadMorePress}>Load More</Button>)}
    </Fragment>
  );
};

export default Launches;

// <Button
//         onClick={async () => {
//           setIsLoadingMore(true);
//           await fetchMore({
//             variables: {
//               after: data.launches.cursor
//             }
//           });
//           setIsLoadingMore(false);
//         }}
//       >
//         Load More
//       </Button>
