import 'mocha'
import 'verify-it'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as testdouble from 'testdouble'

testdouble.config({ ignoreWarnings: true })
chai.use(chaiAsPromised)
chai.should()
