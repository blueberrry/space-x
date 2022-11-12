import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloClient, NormalizedCacheObject, ApolloProvider } from '@apollo/client';
import { cache } from './cache';
import Pages from './pages';
import injectStyles from './styles';

// Init apollo client

const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  cache,
  uri: 'http://localhost:4000/graphql',
});

injectStyles();

// Pass apollo client instance to the ApolloProvider component
// * Apollo Provider is similar to React's context provider. We can access the context anywhere in the component tree
ReactDOM.render(
  <ApolloProvider client={client}>
    <Pages />
  </ApolloProvider>,
  document.getElementById('root')
);
