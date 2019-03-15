export class HaveIBeenPwnedPasswordApi {
  constructor (
    private readonly requestPromise: any
  ) {}

  private readonly API_URL = 'https://api.pwnedpasswords.com/range/'

  async fetchResults (hash: string, retries: number = 5): Promise<hibpHash[]> {
    const hashStart = hash.slice(0, 5)
    const uri = `${this.API_URL}${hashStart}`
    const response = await this.requestPromise({
      uri,
      json: true,
      resolveWithFullResponse: true
    })

    if (response.statusCode === 200) {
      const formattedResults = this.formatResults(response.body.split('\r\n'), hashStart)
      return formattedResults
    }

    if (response.statusCode === 429) {
      if (retries > 0 && response.headers) {
        const retryAfterInMillis = response.headers['Retry-After'] * 1000
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
      const resultTuple = result.split(':') as hibpHash
      resultTuple[0] = hashStart.concat(resultTuple[0])
      return resultTuple
    })
  }
}

export type hibpHash = [string, number]

export namespace HaveIBeenPwnedPasswordApi {
  export class ApiDownError extends Error {
    constructor (readonly code: Error, message: string = 'haveibeenpwned API is down') {
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
