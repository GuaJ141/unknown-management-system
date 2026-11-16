import axios from 'axios'
import { localhost } from '../constants/api'

// export const apiClient = axios.create({
//   baseURL: import.meta.env.DEV ? '/' : localhost,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// })

export const apiClient = axios.create({
  baseURL: localhost,
  headers: {
    'Content-Type': 'application/json',
  },
})
