/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import ApiController from '#controllers/api_controller'

router.any('/api/:module/:id?', [ApiController, 'handle'])
