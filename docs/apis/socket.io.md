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
