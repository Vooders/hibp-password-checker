import { Gen } from 'verify-it'
import { HibpPasswords } from '../src/HibpPasswords'
import { HaveIBeenPwnedPasswordApi } from '../src/lib/HaveIBeenPwnedPasswordApi'
import * as testdouble from 'testdouble'
import * as requestPromise from 'request-promise'
import sha1 = require('sha1')

const genApiResponse = () => {
  const amountOfResults = Gen.integerBetween(100, 500)()
  return [...Array(amountOfResults)].map(() => {
    return [genHash(), Gen.integerBetween(1, 500)()]
  })
}

const genResponseWith = (expectedHash: string, expectedAmount: number) => {
  const generatedResults = genApiResponse()
  const randomIndex = Gen.integerBetween(0, generatedResults.length - 1)()
  generatedResults[randomIndex] = [expectedHash, expectedAmount]
  return generatedResults
}

const genHash = () => {
  return sha1(Gen.word().concat(Gen.word()))
}

describe('PasswordChecker', () => {
  verify.it('should return the correct number of times if reported by hibp',
    Gen.word, Gen.integerBetween(1, 500), async (password, amount) => {
      const hash = sha1(password) as string
      const mockApi = testdouble.object(new HaveIBeenPwnedPasswordApi(requestPromise))
      testdouble.when(
        mockApi.fetchResults(testdouble.matchers.anything(), testdouble.matchers.anything())
      ).thenResolve(genResponseWith(hash, amount))

      return HibpPasswords.lookup(password, 0, mockApi).should.eventually.eql(amount)
    })

  verify.it('should return 0 if not reported by hibp',
    Gen.word, async (password) => {
      const mockApi = testdouble.object(new HaveIBeenPwnedPasswordApi(requestPromise))
      testdouble.when(
        mockApi.fetchResults(testdouble.matchers.anything(), testdouble.matchers.anything())
      ).thenResolve(genApiResponse())

      return HibpPasswords.lookup(password, 0, mockApi).should.eventually.eql(0)
    })
})
