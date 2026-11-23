function ApolloServerPluginLandingPageGraphQLPlayground() {
  return {
    async serverWillStart() {
      return {
        async renderLandingPage() {
          return { html: '<!doctype html><html><body>GraphQL endpoint</body></html>' };
        },
      };
    },
  };
}

module.exports = { ApolloServerPluginLandingPageGraphQLPlayground };
