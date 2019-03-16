import { HaveIBeenPwnedPasswordApi } from './lib/HaveIBeenPwnedPasswordApi'
import * as requestPromise from 'request-promise'
import sha1 = require('sha1')

export namespace PasswordChecker {
  export async function check (password: string, api: HaveIBeenPwnedPasswordApi = new HaveIBeenPwnedPasswordApi(requestPromise)): Promise<number> {
    const hash = sha1(password) as string
    const results = await api.fetchResults(hash)

    return results.reduce((timesSeen, tuple) => {
      return (tuple[0] === hash) ? tuple[1] : timesSeen
    }, 0)
  }
}
