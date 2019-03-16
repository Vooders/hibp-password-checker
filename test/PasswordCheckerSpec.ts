import { Gen } from 'verify-it'
import { PasswordChecker } from '../src/PasswordChecker'
import { HaveIBeenPwnedPasswordApi } from '../src/lib/HaveIBeenPwnedPasswordApi'
import * as testdouble from 'testdouble'
import * as requestPromise from 'request-promise'

const genApiResponse = (expectedHash: string, expectedAmount: number) => {
  const amountOfResuls = Gen.integerBetween(100, 300)()
  const generatedResults = new Array(amountOfResuls).map(() => {

  })
}

describe('PasswordChecker', () => {
  verify.it('should return the correct number of times reported by hibp', Gen.word, async (password) => {
    const mockApi = testdouble.object(new HaveIBeenPwnedPasswordApi(requestPromise))
    testdouble.when(mockApi.fetchResults(testdouble.matchers.anything())).thenResolve()
    await PasswordChecker.check(password, mockApi)
  })
})
