import { ApolloClient, DefaultOptions, InMemoryCache } from "@apollo/client";
import { GRAPHQL_API_URL } from "../consts/api";
import { createUploadLink } from "apollo-upload-client";
const httpLink = createUploadLink({
  uri: GRAPHQL_API_URL
});
const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: "no-cache",
    errorPolicy: "ignore"
  },
  query: {
    fetchPolicy: "no-cache",
    errorPolicy: "all"
  }
};

export const client = new ApolloClient({
  link: httpLink as any,
  cache: new InMemoryCache(),
  defaultOptions
});
