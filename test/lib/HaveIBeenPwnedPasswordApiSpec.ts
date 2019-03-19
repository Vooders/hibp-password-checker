import { HaveIBeenPwnedPasswordApi } from '../../src/lib/HaveIBeenPwnedPasswordApi'
import { Gen } from 'verify-it'
import { httpsClient } from '../../src/lib/httpsClient'
import * as testdouble from 'testdouble'
import { sha1 } from '../../src/lib/Sha1'

describe('HaveIBeenPwnedApi', () => {
  describe('check()', () => {
    verify.it('should call the API with the correct request', Gen.word, async (password) => {
      const mockHttpsClient = testdouble.object(httpsClient)
      testdouble.when(
        mockHttpsClient.get(testdouble.matchers.anything())).thenResolve({
          statusCode: 200,
          body: 'someResponse'
        }
      )

      const api = new HaveIBeenPwnedPasswordApi(mockHttpsClient)
      const hash = sha1(password)
      const hashStart = hash.slice(0, 5)

      await api.fetchResults(hash, 0)

      testdouble.verify(mockHttpsClient.get(`https://api.pwnedpasswords.com/range/${hashStart}`))
    })

    verify.it('should return a non empty array', Gen.word, async (password) => {
      const api = new HaveIBeenPwnedPasswordApi(httpsClient)
      const hash = sha1(password)
      const results = await api.fetchResults(hash, 0)
      return results.length.should.be.greaterThan(0)
    })

    verify.it('should throw an MalformedResponseError if haveibeenpwned API returns something unparsable',
      Gen.word, Gen.object, async (password, response) => {
        const hash = sha1(password)
        const mockRequestPromise = testdouble.object(httpsClient)
        testdouble.when(mockRequestPromise.get(testdouble.matchers.anything()))
          .thenResolve(response)

        const api = new HaveIBeenPwnedPasswordApi(mockRequestPromise)
        return api.fetchResults(hash, 0).should.eventually.be
          .rejectedWith(HaveIBeenPwnedPasswordApi.MalformedResponseError, 'The API response was malformed')
          .with.property('response', response)
      })

    verify.it('should throw an ApiDownError if haveibeenpwned API returns 5xx',
      Gen.word, Gen.integerBetween(500, 599), async (password, errorCode) => {
        const hash = sha1(password)
        const mockRequestPromise = testdouble.object(httpsClient)
        testdouble.when(mockRequestPromise.get(testdouble.matchers.anything()))
          .thenResolve({
            statusCode: errorCode,
            body: 'server down'
          })

        const api = new HaveIBeenPwnedPasswordApi(mockRequestPromise)
        return api.fetchResults(hash, 0).should.eventually.be
          .rejectedWith(HaveIBeenPwnedPasswordApi.ApiDownError, 'haveibeenpwned API is down')
          .with.property('code', errorCode)
      })

    verify.it('should retry up to the correct number of times if haveibeenpwned API returns 429',
      Gen.word, Gen.integerBetween(2,4), async (password, retries) => {
        const hash = sha1(password)
        const mockRequestPromise = testdouble.object(httpsClient)
        testdouble.when(mockRequestPromise.get(testdouble.matchers.anything()))
          .thenResolve({
            statusCode: 429,
            headers: {
              'Retry-After': '.25'
            },
            body: 'server down'
          })

        const api = new HaveIBeenPwnedPasswordApi(mockRequestPromise)
        await api.fetchResults(hash, retries)

        return testdouble.verify(mockRequestPromise.get(testdouble.matchers.anything()), { times: retries + 1 })
      })
  })
})
