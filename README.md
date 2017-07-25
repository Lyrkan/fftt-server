FFTT Server
===

# Requirements

* Node 6.10+
* Yarn
* A MongoDB instance
* A JWT provider and its public certificate

# Setup

## JWT certificate

Copy your public JWT certificate to `certs/jwt.pub`.

If you want to use another path, simply set the `JWT_PUBLIC_CERT` environment variable.

## Start the server

```
$ yarn
$ yarn build
$ node dist/index.js
```

# Global environment variables

These environment variables define the global behavior of the server.

You can either set them in your environment or use a [Dotenv](https://github.com/motdotla/dotenv) file during development (see the `.env.dist` file as an example).

| Name                           | Type   | Description                                                                | Default value             |
|--------------------------------|--------|----------------------------------------------------------------------------|---------------------------|
| COORDINATOR_PORT               | number | Port the coordinator will be listening to                                  | 8080                      |
| COORDINATOR_STOP_TIMEOUT       | number | Delay allowed before a timeout exception is thrown on coordinator shutdown | 30000                     |
| COORDINATOR_TICK_INTERVAL      | number | Interval between coordinator ticks (in ms)                                 | 5000                      |
| JWT_PUBLIC_CERT                | string | Path to the JWT public certificate                                         | certs/jwt.pub             |
| LOG_LEVEL                      | number | Logging level: 0 (Trace), 1 (Debug), 2 (Info), 3 (Warning) or 4 (Error)    | 2                         |
| MATCHMAKER_MAX_RANK_DIFFERENCE | number | Maximum rank difference between two players in matchmaking                 | 500                       |
| MONGODB_URI                    | string | URI of the MongoDB instance                                                | mongodb://localhost/fftt  |
| PROVIDER_MAX_NODES             | number | Maximum concurrent nodes allowed                                           | 10                        |
| PROVIDER_MAX_PORT              | number | Maximum port the nodes can run on                                          | 9999                      |
| PROVIDER_MIN_PORT              | number | Minimum port the nodes can run on                                          | 9000                      |
| PROVIDER_NODE_TIMEOUT          | number | Number of seconds nodes are allowed to run                                 | 600                       |

# Provider-specific environment variables

These environment variables are only relevant to a specific type of node provider.

## Local provider

| Name                      | Type   | Description                                                                                                       | Default value |
|---------------------------|--------|-------------------------------------------------------------------------------------------------------------------|---------------|
| LOCAL_PROVIDER_HOST       | string | Hostname that can be used to connect to nodes. If empty the IP of the first available IPV4 interface will be used |               |

## Docker provider

WIP.
