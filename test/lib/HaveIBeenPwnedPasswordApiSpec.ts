import { HaveIBeenPwnedPasswordApi } from '../../src/lib/HaveIBeenPwnedPasswordApi'
import { Gen } from 'verify-it'
import * as requestPromise from 'request-promise'
import * as testdouble from 'testdouble'

const sha1 = require('sha1')

describe('HaveIBeenPwnedApi', () => {
  describe('check()', () => {
    verify.it('should call the API with the correct request', Gen.word, async (password) => {
      const mockRequestPromise = testdouble.function(requestPromise)
      testdouble.when(
        mockRequestPromise(testdouble.matchers.anything())).thenResolve({
          statusCode: 200,
          body: 'someResponse'
        }
      )

      const api = new HaveIBeenPwnedPasswordApi(mockRequestPromise)
      const hash = sha1(password)
      const hashStart = hash.slice(0, 5)

      await api.fetchResults(hash)

      testdouble.verify(mockRequestPromise({
        uri: `https://api.pwnedpasswords.com/range/${hashStart}`,
        json: true,
        resolveWithFullResponse: true
      }))
    })

    verify.it('should return a non empty array', Gen.word, async (password) => {
      const api = new HaveIBeenPwnedPasswordApi(requestPromise)
      const hash = sha1(password)
      const results = await api.fetchResults(hash)
      return results.length.should.be.greaterThan(0)
    })

    verify.it('should throw an MalformedResponseError if haveibeenpwned API returns something unparsable',
      Gen.word, Gen.object, async (password, response) => {
        const hash = sha1(password)
        const mockRequestPromise = testdouble.function(requestPromise)
        testdouble.when(mockRequestPromise(testdouble.matchers.anything()))
          .thenResolve(response)

        const api = new HaveIBeenPwnedPasswordApi(mockRequestPromise)
        return api.fetchResults(hash).should.eventually.be
          .rejectedWith(HaveIBeenPwnedPasswordApi.MalformedResponseError, 'The API response was malformed')
          .with.property('response', response)
      })

    verify.it('should throw an ApiDownError if haveibeenpwned API returns 5xx',
      Gen.word, Gen.integerBetween(500, 599), async (password, errorCode) => {
        const hash = sha1(password)
        const mockRequestPromise = testdouble.function(requestPromise)
        testdouble.when(mockRequestPromise(testdouble.matchers.anything()))
          .thenResolve({
            statusCode: errorCode,
            body: 'server down'
          })

        const api = new HaveIBeenPwnedPasswordApi(mockRequestPromise)
        return api.fetchResults(hash).should.eventually.be
          .rejectedWith(HaveIBeenPwnedPasswordApi.ApiDownError, 'haveibeenpwned API is down')
          .with.property('code', errorCode)
      })

    verify.it('should retry up to the correct number of times if haveibeenpwned API returns 429',
      Gen.word, Gen.integerBetween(2,4), async (password, retries) => {
        const hash = sha1(password)
        const mockRequestPromise = testdouble.function(requestPromise)
        testdouble.when(mockRequestPromise(testdouble.matchers.anything()))
          .thenResolve({
            statusCode: 429,
            headers: {
              'Retry-After': '.25'
            },
            body: 'server down'
          })

        const api = new HaveIBeenPwnedPasswordApi(mockRequestPromise)
        await api.fetchResults(hash, retries)

        return testdouble.verify(mockRequestPromise(testdouble.matchers.anything()), { times: retries + 1 })
      })
  })
})
