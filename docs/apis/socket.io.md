# Socket.IO API

The Socket.IO API for NestMTX provides a real-time, event-driven interface for interacting with various components of the NestMTX system. This API is ideal for applications that require instant updates or need to maintain a continuous connection to the server. The Socket.IO API supports the same modules and L.C.R.U.D. (List, Create, Read, Update, Delete) methods as the HTTP API, but requests are handled over WebSockets, offering lower latency and more efficient communication.

## How to Make Requests

### Request Structure

Each request to the NestMTX Socket.IO API is made by emitting an event from the client to the server. The event data should include the necessary information to specify the module, command, and any additional parameters required for the operation.

- **Event Name**: All requests are made via the `request` event.
- **Payload**: The payload is a JSON object that must adhere to the following structure:
  - **command**: The action you want to perform, such as `list`, `create`, `read`, `update`, or `delete`.
  - **module**: The name of the module you want to interact with (e.g., `users`, `cameras`, `credentials`).
  - **requestId**: A unique identifier for your request, used to match responses with requests.
  - **entity**: (Optional) The specific entity you want to operate on, required for `read`, `update`, and `delete` commands.
  - **payload**: (Optional) The data required for `create` and `update` commands.

### Example Request

Here’s an example of how to make a request to list all users:

```javascript
socket.emit('request', {
  command: 'list',
  module: 'users',
  requestId: 'unique-request-id',
});
```

This sends a `list` command to the `users` module. The server will respond with the result of the request, which can be handled using the `socket.on` method to listen for the response.

[Read More](/apis/structure)

### Handling Responses

Responses from the server are emitted back to the client with the same `requestId` you provided. Here's how you can listen for and handle the response:

```javascript
socket.on('unique-request-id', (response) => {
  console.log('Received response:', response);
});
```

The server will send the result of your request, which could be the requested data or an error message if the request was invalid.

## How to Authenticate

### Authentication Overview

The NestMTX Socket.IO API requires clients to authenticate using a Bearer token before they can perform any operations. This ensures that only authorized users can interact with the system.

### Obtaining a Token

To obtain a Bearer token, you first need to authenticate using the HTTP API’s authentication endpoint. Once you have the token, you can use it to authenticate your Socket.IO connection.

### Using the Token

To authenticate your Socket.IO connection, include the token in the connection options. The token can be passed via the `Authorization` header, `auth` object, or query parameters in the Socket.IO connection options.

Here's an example of how to set up the token in the connection:

```javascript
const socket = io('https://your-nestmtx-instance.com', {
  auth: {
    token: 'your-access-token',
  },
  extraHeaders: {
    Authorization: `Bearer your-access-token`,
  },
  query: {
    token: 'your-access-token',
  },
});
```

Replace `your-access-token` with the actual token you received from the authentication endpoint.

### Middleware for Authentication

The server will automatically handle the authentication process when a client connects. If the authentication fails, the server will reject the connection, and the client will receive an error event.

### Reconnecting with a New Token

If you need to update the token (e.g., after it has expired), you can disconnect and reconnect the Socket.IO client with the new token:

```javascript
socket.disconnect();

socket.io.opts.auth.token = 'new-access-token';
socket.io.opts.extraHeaders.Authorization = `Bearer new-access-token`;
socket.io.opts.query.token = 'new-access-token';

socket.connect();
```

This ensures that all subsequent requests are authenticated using the new token.

## Getting Status Updates

NestMTX provides camera feed status updates over socket.io which can be subscribed to.

### Topic Format

Socket.IO Topics (event names) will be constructed as follows:

`<domain>:<event type>`

The placeholders are defined as follows:

| Placeholder    | Definition                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `<domain>`     | The type of entity that the event is being reported for. <br />Initial feature release will include `camera` and `credentials` |
| `<event type>` | The type of event which is being emitted. <br />See the event types below for more information.                                |

Additionally, there will be the following wildcard topics:

- `<domain>:*` - Domain specific wildcard topic
- `nestmtx:*` - Application-wide wildcard topic

### Payload Format

Payloads will be JSON objects which can be easily parsed. They will have the following properties:

| Payload Property | Description                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain`         | The type of entity that the event is being reported for. <br />Initial feature release will include `camera` and `credentials`                                                            |
| `entity`         | An identifier used to identify which entity of the domain the event is being reported for. <br />This will be the `id` column in the database where possible, or `null` when not possible |
| `event`          | The type of event which is being emitted. <br />See the event types below for more information.                                                                                           |
| `details`        | Any additional information related to the event that is being triggered to give additional useful context. Will be a JSON object (`{}`). See event types below for more information       |

### Event Types

The following event types will be reported for the following domains

#### Event Types for the `camera` domain

| Event              | Description                                                                     |
| ------------------ | ------------------------------------------------------------------------------- |
| `demand`           | Emitted when a client attempts to read from the camera feed                     |
| `unDemand`         | Emitted when no more clients are remaining to read from the camera feed         |
| `ready`            | Emitted when the camera feed is ready to be read from the camera feed           |
| `notReady`         | Emitted when the camera feed is no longer ready to be read from the camera feed |
| `read`             | Emitted when a client starts consuming the camera feed                          |
| `unread`           | Emitted when a client stops consuming the camera feed                           |
| `extended`         | Emitted when the source stream authentication has been extended                 |
| `failed-extension` | Emitted when the source stream authentication fails to be extended              |

#### Event Types for the `credentials` domain

| Event             | Description                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticated`   | Emitted when credentials have been authenticated for the first time                                           |
| `reauthenticated` | Emitted when credentials have been refreshed using a refresh token                                            |
| `unauthenticated` | Emitted when credentials fail to refresh using a refresh token and the credentials need to be reauthenticated |

## Streaming Logs

NestMTX sends all logs to Socket.IO using the `log` event. This is the same mechanism used by the "Logs" page in the interface. You can subscribe to this event to get a real-time feed of the logs from NestMTX.
Log events have a payload which contain a JSON object with the following properties:

| Property    | Description                                              |
| ----------- | -------------------------------------------------------- |
| `hostname`  | The hostname of the process which output the log.        |
| `level`     | The level of the log. See the table below for reference. |
| `msg`       | The message of the log event.                            |
| `pid`       | The process ID which output the log.                     |
| `service`   | The service which made the log entry.                    |
| `time`      | The millisecond timestamp of the log entry.              |
| `timestamp` | The ISO formatted timestamp of the log entry.            |

### Log Levels

The log levels are defined as follows:

| Log Level | Description |
| --------- | ----------- |
| `20`      | trace       |
| `30`      | debug       |
| `40`      | info        |
| `50`      | warn        |
| `60`      | error       |
| `70`      | fatal       |
