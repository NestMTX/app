# CLI API

The CLI API for NestMTX allows developers and system administrators to interact directly with the NestMTX system via the command line. This API is particularly useful for scripting, automation, and performing tasks that require direct access to the application's codebase. The CLI commands mirror the L.C.R.U.D. (List, Create, Read, Update, Delete) operations available in other NestMTX APIs, but they are executed through the [ace](https://docs.adonisjs.com/guides/ace/introduction) command in the [AdonisJS framework](https://adonisjs.com/).

:::danger Danger Zone
Using the CLI for managing the application can be dangerous and may have unintended consequences. Aside from the automatically assumed authentication, there can be unintended consequences using CLI commands incorrectly. Please use caution if you must use them, and avoid using them where possible.
:::

## How to Make Requests

### Request Structure

Each CLI request to the NestMTX API is made using the `ace` `command` provided by AdonisJS. The `ace` `command` allows you to interact with the NestMTX application from the terminal, executing commands that perform operations on various modules like users, cameras, and credentials.

- **Command Name**: The CLI API uses the `command` command to initiate operations. This is accessed via the `ace` command.
  
- **Module**: You specify the module you want to interact with, such as `users`, `cameras`, or `credentials`.

- **Arguments**: Each command requires specific arguments depending on the operation you're performing:
  - `command`: The operation you want to perform, such as `list`, `create`, `read`, `update`, or `delete`.
  - `module`: The module you want to operate on (e.g., `users`, `cameras`).
  - `payload`: A JSON string that contains the data for `create` and `update` operations.

### Running CLI Commands

```text
Usage:
  node ace command <command> <module> [<payload>]

Arguments:
  command    The command to run. Must be one of these: "list", "create", "read", "update", "delete"
  module     The module to run the command on
  [payload]  The JSON encoded payload to send to the command. Required for "create" and "update" commands.
```

To execute a command via the CLI API, you need access to the terminal where the NestMTX application is running. For a Dockerized version of the application, you would typically use a command like `docker exec -it nestmtx ace <command>` to run the CLI commands inside the Docker container.

Here’s a basic structure for running a command:

```bash
docker exec -it nestmtx ace command <operation> <module> [payload]
```

- **Example 1: List all users**

```bash
docker exec -it nestmtx ace command list users
```

- **Example 2: Create a new user**

```bash
docker exec -it nestmtx ace command create users '{"username": "new_user", "password": "password123", "can_login": true}'
```

### Automatic Authentication

Because the CLI API has direct access to the application's code, all commands are automatically authenticated as the system user. This means you don’t need to provide any authentication tokens or credentials when running commands via the CLI.

### Command Line Arguments

- **Command**: Specifies the action you want to perform, such as `list`, `create`, `read`, `update`, or `delete`.
- **Module**: Specifies the module or entity you want to perform the action on (e.g., `users`, `cameras`).
- **Payload**: For `create` and `update` commands, you need to provide a JSON-encoded payload containing the data for the new or updated entity. The payload is optional for `list` and `read` commands and should be omitted for `delete` commands.

### Example Requests

1. **List Users**: To list all users in the system:

    ```bash
    docker exec -it nestmtx ace command list users
    ```

2. **Create a User**: To create a new user:

    ```bash
    docker exec -it nestmtx ace command create users '{"username": "john_doe", "password": "securepassword", "can_login": true}'
    ```

3. **Read a User**: To read the details of a specific user:

    ```bash
    docker exec -it nestmtx ace command read users '{"id": 123}'
    ```

4. **Update a User**: To update an existing user’s information:

    ```bash
    docker exec -it nestmtx ace command update users '{"id": 123, "password": "newpassword123", "can_login": false}'
    ```

5. **Delete a User**: To delete a user:

    ```bash
    docker exec -it nestmtx ace command delete users '{"id": 123}'
    ```

### Handling Responses

The results of each command are output directly to the terminal. If a command is successful, the details of the operation or the data retrieved will be displayed. In case of an error, a detailed error message will be shown, including any validation issues or problems encountered during the execution.

## Notes

- **Dockerized Environment**: If you are running NestMTX inside a Docker container, make sure to use `docker exec -it` to access the container’s command line and run the `ace` commands.
- **System User**: The CLI API is executed with system-level access, assuming full authentication and permissions for the actions being performed.
