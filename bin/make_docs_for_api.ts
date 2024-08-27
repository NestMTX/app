import axios from 'axios'

const baseUrl = `http://127.0.0.1:2000`
const api = axios.create({ baseURL: baseUrl })

api.get('/api/swagger').then(async ({ data: swagger }) => {
  console.log(swagger)
})
