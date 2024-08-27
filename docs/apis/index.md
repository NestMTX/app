# API Basics

NestMTX provides multiple APIs to interact with the system, offering flexibility to integrate with various protocols and use cases. The available APIs include:

- **HTTP API**
- **Socket.IO API**
- **MQTT API**
- **CLI API**

Despite the different protocols, all APIs use the same underlying modules and support L.C.R.U.D. operations (List, Create, Read, Update, Delete). However, due to the varying nature of each protocol, requests are formatted and submitted differently for each API.

## Common API Structure

All NestMTX APIs share a common structure for handling requests. Each request is processed by translating it into a command that the application can handle. The following L.C.R.U.D. methods are supported across all APIs:

- **List**: Retrieve a list of entities from the specified module.
- **Create**: Create a new entity within the specified module.
- **Read**: Read a specific entity from the specified module.
- **Update**: Update an existing entity within the specified module.
- **Delete**: Remove an entity from the specified module.

### Modules

Each module in NestMTX can be accessed through any of the APIs. Modules can define specific behaviors for each L.C.R.U.D. operation, such as validation schemas and custom error handling.

## API Details

### HTTP API

The HTTP API is the most common way to interact with NestMTX. Requests are made over standard HTTP/HTTPS, with each L.C.R.U.D. operation corresponding to a specific HTTP method:

[Read More](/apis/http)

### Socket.IO API

The Socket.IO API provides real-time interaction with NestMTX using WebSocket communication. Each L.C.R.U.D. operation is mapped to a specific event that is emitted over the WebSocket connection. This API is ideal for applications requiring immediate feedback and low latency.

[Read More](/apis/socket.io)

### MQTT API

The MQTT API allows for lightweight, publish-subscribe messaging with NestMTX. Each L.C.R.U.D. operation is associated with a specific topic, and messages are published or subscribed to based on the desired operation. This API is particularly useful for IoT applications and scenarios where a low-overhead communication protocol is preferred.

[Read More](/apis/mqtt)

### CLI API

The CLI API enables interaction with NestMTX via command-line interface commands. Each L.C.R.U.D. operation is triggered by executing the corresponding command in the terminal. This API is suitable for automation scripts and environments where a graphical interface is not available.

[Read More](/apis/cli)
