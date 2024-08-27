# API Modules & Methods

All NestMTX APIs share a common structure for handling requests. Each request is processed by translating it into a command that the application can handle. The following describes the API modules and methods which are available for use.


## The `auth` Module
    
User Authentication Operations

| Operation | Description | Requires Authentication |
| --- | --- | --- |
| `create` | Authenticate a user | No |

### Payload for `auth` `create`

| Field | Type |
| --- | --- |
| `username` | string |
| `password` | string |


## The `cameras` Module
    
Manage Camera Feeds

| Operation | Description | Requires Authentication |
| --- | --- | --- |
| `list` | Search for and list Cameras | Yes |
| `read` | Read an cameras entity | Yes |
| `update` | Update an cameras entity | Yes |

### Payload for `cameras` `update`

| Field | Type |
| --- | --- |
| `mtx_path` | string |
| `is_enabled` | boolean |


## The `credentials` Module
    
Manage Google Cloud Platform and Google Device Access Console credentials

| Operation | Description | Requires Authentication |
| --- | --- | --- |
| `list` | Search for and list credentials | Yes |
| `create` | Add new credentials | Yes |
| `read` | Authorize credentials based on the authorization code | Yes |
| `update` | Get either the authorization URL or the Device Access Console URL | Yes |
| `delete` | Delete an credentials entity | Yes |

### Payload for `credentials` `create`

| Field | Type |
| --- | --- |
| `description` | string |
| `oauth_client_id` | string |
| `oauth_client_secret` | string |
| `dac_project_id` | string |


### Payload for `credentials` `update`

| Field | Type |
| --- | --- |
| `origin` | string |


## The `cronjobs` Module
    
Cronjob Statuses

| Operation | Description | Requires Authentication |
| --- | --- | --- |
| `list` | List all cronjobs entities | Yes |
| `update` | Update an cronjobs entity | Yes |

## The `health` Module
    
Application Health

| Operation | Description | Requires Authentication |
| --- | --- | --- |
| `list` | Check the health of the application | No |

## The `htop` Module
    
Health & Table of Processes

| Operation | Description | Requires Authentication |
| --- | --- | --- |
| `list` | Get the HTOP Report | Yes |
| `update` | Update an htop entity | Yes |

## The `swagger` Module
    
API Specification

| Operation | Description | Requires Authentication |
| --- | --- | --- |
| `list` | Get the OpenAPI specification for the API | No |

## The `users` Module
    
Manage Users

| Operation | Description | Requires Authentication |
| --- | --- | --- |
| `list` | List all users entities | Yes |
| `create` | Create a new users entity | Yes |
| `read` | Read an users entity | Yes |
| `update` | Update an users entity | Yes |
| `delete` | Delete an users entity | Yes |

### Payload for `users` `create`

| Field | Type |
| --- | --- |
| `username` | string |
| `password` | string |
| `can_login` | boolean |


### Payload for `users` `update`

| Field | Type |
| --- | --- |
| `password` | string |
| `can_login` | boolean |


