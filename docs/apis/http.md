# HTTP API

The HTTP API for NestMTX provides a robust and flexible way to interact with the various components of the NestMTX system. Designed to be RESTful, the API supports standard HTTP methods like GET, POST, PUT, and DELETE, enabling you to perform CRUD (Create, Read, Update, Delete) operations on modules such as users, cameras, and credentials.

## How to Make Requests

### Request Structure

Each request to the NestMTX HTTP API follows the typical RESTful structure, where modules are accessed via URLs and actions are performed using HTTP methods. Here’s a breakdown of how to structure your requests:

- **Base URL**: All API requests are prefixed with the base URL of your NestMTX instance, e.g., `https://your-nestmtx-instance.com/api`.
  
- **Endpoints**: Specific operations are accessed via endpoints that correspond to different modules. For example:
  - `/api/users` to manage users.
  - `/api/cameras` to manage cameras.
  - `/api/credentials` to manage Google Cloud credentials.

For a list of available modules, please see the [Modules & Methods Documentation](/apis/structure)

- **HTTP Methods**:
  - `GET` is used to retrieve information (e.g., listing users or reading camera data).
  - `POST` is used to create new resources (e.g., adding a new user or credentials).
  - `PUT` is used to update existing resources (e.g., modifying user information).
  - `DELETE` is used to remove resources (e.g., stopping a user).

### Example Request

Here’s an example of how to make a request to list all users:

```bash
curl -X GET https://your-nestmtx-instance.com/api/users \
  -H "Authorization: Bearer <your-access-token>"
```

This command sends a `GET` request to the `/api/users` endpoint, with the required authorization token included in the headers.

### Request Parameters

- **Path Parameters**: These are part of the URL and specify the resource you are acting on. For example, in the URL `/api/users/{id}`, `{id}` is a path parameter representing a specific user.

- **Query Parameters**: These are appended to the URL and provide additional filters or options for the request. For example, `/api/users?limit=10` would limit the results to 10 users.

- **Request Body**: For `POST` and `PUT` requests, the request body contains the data you want to create or update. The data should be in JSON format and conform to the API’s schema.

[Read More](/apis/structure)

## How to Authenticate

### Authentication Overview

The NestMTX HTTP API uses Bearer token authentication to secure its endpoints. This method ensures that only authorized users can perform actions on the system’s resources.

### Obtaining a Token

To authenticate with the API, you need to obtain a JSON Web Token (JWT) by making a request to the authentication endpoint. Here’s how you can obtain an access token:

```bash
curl -X POST https://your-nestmtx-instance.com/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'
```

If the authentication is successful, the server will return a JWT token in the response, which you can use to authenticate subsequent API requests.

### Using the Token

Once you have the token, you include it in the `Authorization` header of your HTTP requests. Here’s an example of how to include the token in a request to list cameras:

```bash
curl -X GET https://your-nestmtx-instance.com/api/cameras \
  -H "Authorization: Bearer <your-access-token>"
```

Replace `<your-access-token>` with the actual token you received from the authentication endpoint.

## OpenAPI Specifications

The NestMTX HTTP API provides OpenAPI v3 compatible JSON specifications. You can access these from the `/api/swagger` path.

```bash
curl -X GET https://your-nestmtx-instance.com/api/swagger
```
