![Cactuar](http://i.imgur.com/5aPSfQ7.png)
FFTT Server
===

# Requirements

* Node 6.10+
* Yarn
* A MongoDB instance
* A JWT provider and its public certificate (each token should have at least a `sub` property)

# Setup

## JWT certificate

Copy your public JWT certificate to `certs/jwt.pub`.

If you want to use another path, simply set the `JWT_PUBLIC_CERT` environment variable.

## Build and start the server

```
$ yarn
$ yarn build
$ node dist/index.js
```

Once the server is running you can stop it gracefully by sending the SIGINT signal (usually by pressing CTRL-C).

# How does it work?

The server is divided into two big parts: the coordinator and the nodes.

## Coordinator

The coordinator is the heart of the server, its role being to manage games and players.

The players first connect to it using a [Socket.io](https://socket.io/) client and then authenticate themselves using [JWT](https://jwt.io/) (see [socketio-jwt](https://github.com/auth0/socketio-jwt)).

Once a player is authenticated, it is registered into MongoDB (which allows, for instance, to keep track of its rank) and can start using the matchmaking feature.

A matchmaking tick is triggered periodically and checks which players from the waiting queue can be grouped together based on their current rank.

For every new game a node, on which players can connect, is started. The flexibility of the coordinator allows to use different kind of node providers in order to start nodes either locally or remotely (e.g. using Docker).

## Nodes

A node is a server dedicated to a single game.

# Global environment variables

These environment variables define the global behavior of the server.

You can either set them in your environment or use a [Dotenv](https://github.com/motdotla/dotenv) file during development (see the `.env.dist` file as an example).

Durations are parsed using [timestring](https://github.com/mike182uk/timestring).

| Name                           | Type     | Description                                                                | Default value             |
|--------------------------------|----------|----------------------------------------------------------------------------|---------------------------|
| COORDINATOR_PORT               | number   | Port the coordinator will be listening to                                  | 8080                      |
| COORDINATOR_STOP_TIMEOUT       | duration | Delay allowed before a timeout exception is thrown on coordinator shutdown | 30secs                    |
| COORDINATOR_TICK_INTERVAL      | duration | Interval between coordinator ticks                                         | 5secs                     |
| DATA_DIR                       | string   | Path to the directory containing data files (e.g. cards.json)              | data                      |
| JWT_PUBLIC_CERT                | string   | Path to the JWT public certificate                                         | certs/jwt.pub             |
| JWT_ALGORITHMS                 | string   | Supported JWT algorithms, separated by commas (",")                        | RS256                     |
| LOG_LEVEL                      | number   | Logging level: 0 (Trace), 1 (Debug), 2 (Info), 3 (Warning) or 4 (Error)    | 2                         |
| MATCHMAKER_MAX_RANK_DIFFERENCE | number   | Maximum rank difference between two players in matchmaking                 | 500                       |
| MONGODB_URI                    | string   | URI of the MongoDB instance                                                | mongodb://localhost/fftt  |
| PROVIDER_MAX_NODES             | number   | Maximum concurrent nodes allowed                                           | 10                        |
| PROVIDER_MAX_PORT              | number   | Maximum port the nodes can run on. If falsy a random port will be used.    |                           |
| PROVIDER_MIN_PORT              | number   | Minimum port the nodes can run on. If falsy a random port will be used.    |                           |
| PROVIDER_NODE_TIMEOUT          | duration | How much time nodes are allowed to run                                     | 10mins                    |

# Provider-specific environment variables

These environment variables are only relevant to a specific type of node provider.

## Local provider

| Name                      | Type   | Description                                                                                                       | Default value |
|---------------------------|--------|-------------------------------------------------------------------------------------------------------------------|---------------|
| LOCAL_PROVIDER_HOST       | string | Hostname that can be used to connect to nodes. If empty the IP of the first available IPV4 interface will be used |               |

## Docker provider

WIP.
