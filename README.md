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

| Name                      | Type   | Description                                                                | Default value             |
|---------------------------|--------|----------------------------------------------------------------------------|---------------------------|
| COORDINATOR_MAX_NODES     | number | Maximum concurrent nodes allowed                                           | 10                        |
| COORDINATOR_PORT          | number | Port the coordinator will be listening to                                  | 8080                      |
| COORDINATOR_STOP_TIMEOUT  | number | Delay allowed before a timeout exception is thrown on coordinator shutdown | 30000                     |
| COORDINATOR_TICK_INTERVAL | number | Interval between coordinator ticks (in ms)                                 | 5000                      |
| JWT_PUBLIC_CERT           | string | Path to the JWT public certificate                                         | certs/jwt.pub             |
| LOG_LEVEL                 | number | Logging level: 0 (Trace), 1 (Debug), 2 (Info), 3 (Warning) or 4 (Error)    | 2                         |
| MONGODB_URI               | string | URI of the MongoDB instance                                                | mongodb://localhost/fftt  |
