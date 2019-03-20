import { httpsClient } from './httpsClient'

export class HaveIBeenPwnedPasswordApi {
  constructor (
    private readonly httpsClient: httpsClient
  ) {}

  private readonly API_URL = 'https://api.pwnedpasswords.com/range/'

  async fetchResults (hash: string, retries: number): Promise<HaveIBeenPwnedPasswordApi.HashTuple[]> {
    const hashStart = hash.slice(0, 5)
    const uri = this.API_URL.concat(hashStart)
    const response = await this.httpsClient.get(uri)

    if (response.statusCode === 200) {
      const formattedResults = this.formatResults(response.body.split('\r\n'), hashStart)
      return formattedResults
    }

    if (response.statusCode === 429) {
      if (retries > 0 && response.headers) {
        const retryAfterInMillis = Number(response.headers['Retry-After']) * 1000
        const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        await timeout(retryAfterInMillis)
        return this.fetchResults(hash, --retries)
      } else {
        return []
      }
    }

    if (response.statusCode >= 500) {
      throw new HaveIBeenPwnedPasswordApi.ApiDownError(response.statusCode)
    }

    throw new HaveIBeenPwnedPasswordApi.MalformedResponseError(response)
  }

  private formatResults (responseArray: string[], hashStart: string) {
    return responseArray.map((result: string) => {
      const resultTuple = result.split(':') as HaveIBeenPwnedPasswordApi.HashTuple
      resultTuple[0] = hashStart.concat(resultTuple[0])
      return resultTuple
    })
  }
}

export namespace HaveIBeenPwnedPasswordApi {
  export type HashTuple = [string, number]

  export class ApiDownError extends Error {
    constructor (readonly code: number, message: string = 'haveibeenpwned API is down') {
      super(message)
      this.name = this.constructor.name
    }
  }

  export class MalformedResponseError extends Error {
    constructor (readonly response: any, message: string = 'The API response was malformed') {
      super(message)
      this.name = this.constructor.name
    }
  }
}
