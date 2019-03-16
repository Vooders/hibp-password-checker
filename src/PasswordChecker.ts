import { HaveIBeenPwnedPasswordApi } from './lib/HaveIBeenPwnedPasswordApi'
import * as requestPromise from 'request-promise'
const sha1 = require('sha1')

export namespace PasswordChecker {
  export async function check (password: string, api: HaveIBeenPwnedPasswordApi = new HaveIBeenPwnedPasswordApi(requestPromise)): Promise<number> {
    const hash = sha1(password)
    const results = await api.fetchResults(hash)
    return results.length
  }
}
