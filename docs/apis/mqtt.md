# MQTT API

The MQTT API for NestMTX provides a lightweight messaging protocol to interact with the various components of the NestMTX system. This API is particularly suited for environments where bandwidth is limited, or when low-latency, real-time communication is required. The MQTT API supports the same modules and L.C.R.U.D. (List, Create, Read, Update, Delete) methods as the HTTP and Socket.IO APIs, but requests are handled as messages published to specific MQTT topics.

## How to Make Requests

### Request Structure

Each request to the NestMTX MQTT API is made by publishing a message to the appropriate topic on the MQTT broker. The payload of the message should include the necessary information to specify the module, command, and any additional parameters required for the operation.

- **Base Topic**: All API requests are published to a base topic configured in your NestMTX environment, e.g., `nestmtx/requests`.
  
- **Request Topics**: Requests are published to a base topic followed by the keyword `requests`. For example:
  - `nestmtx/requests` to manage general API requests.

- **Response Topics**: The server publishes responses to topics using the base topic followed by the keyword `responses` and the request ID. For example:
  - `nestmtx/responses/{requestId}` where `{requestId}` is the unique identifier for the request.

### Example Request

Here’s an example of how to make a request to list all users:

1. Subscribe to the `nestmtx/responses/unique-request-id` topic to receive the response.
2. Publish a message to the `nestmtx/requests` topic with the following JSON payload:

```json
{
  "command": "list",
  "module": "users",
  "requestId": "unique-request-id"
}
```

### Request Parameters

- **Command**: The action you want to perform, such as `list`, `create`, `read`, `update`, or `delete`.
- **Module**: The name of the module you want to interact with (e.g., `users`, `cameras`, `credentials`).
- **Request ID**: A unique identifier for your request, used to match responses with requests.
- **Entity**: (Optional) The specific entity you want to operate on, required for `read`, `update`, and `delete` commands.
- **Payload**: (Optional) The data required for `create` and `update` commands.

[Read More](/apis/structure)

### Handling Responses

The server will publish the response to a topic that includes the request ID you provided. Subscribe to this topic to receive the response:

```text
nestmtx/responses/unique-request-id
```

The server will send the result of your request, which could be the requested data or an error message if the request was invalid.

## How to Authenticate

### Authentication Overview

The NestMTX MQTT API requires clients to authenticate using a Bearer token. This token must be included in the request payload to ensure that only authorized users can interact with the system.

### Obtaining a Token

To obtain a Bearer token, you first need to authenticate using the `auth` module's `create` command.

### Using the Token

The token should be included as part of the request payload under the `token` field. Here’s an example payload for listing users with a token:

```json
{
  "command": "list",
  "module": "users",
  "requestId": "unique-request-id",
  "token": "your-access-token"
}
```

Replace `your-access-token` with the actual token you received from the authentication endpoint.

### Middleware for Authentication

The server will automatically handle the authentication process when a client sends a request. If the token is valid, the request will proceed; otherwise, the server will reject the request, and the client will receive an error message in the response topic.
