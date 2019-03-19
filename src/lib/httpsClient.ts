import * as https from 'https'

export type httpsClient = {
  get (url: string): Promise<httpsClient.Response>
}

export namespace httpsClient {
  export type Response = {
    readonly statusCode: number,
    readonly headers: {
      readonly [key: string]: string
    },
    readonly body: string
  }

  export function get (url: string): Promise<Response> {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (res) => {
        const body: any = []
        res.on('data', (chunk) => body.push(chunk))
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body.join('')
          } as Response)
        })
      })
      request.on('error', (err) => reject(err))
    })
  }
}
