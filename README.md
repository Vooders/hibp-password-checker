# HaveIBeenPwned Password Lookup

A zero (production) dependency NPM module to securely check if a password exists in Troy Hunt's Pwned Passwords API.

The API uses k-anonymity to avoid sending even hashed versions of a password to the API. Instead only sending the first 5 characters of a sha1 hash of the password. The API then returns all the sha1 hashes which start with those 5 characters. This module then checks the provided hash against this list and returns the amount of time it has been seen.

## Usage

The module returns an integer which represents the amount of times it has been seen in the database.

#### Display count using a promise Chain
``` javascript
  const HibpPasswords = require('HibpPasswords')

  HibpPasswords.lookup('aPassword')
    .then(count => {
      console.log(`Password was found ${count} times.`)
    })
    .catch(err => {
      console.error(err)
    })
```

#### Display count using async/await
``` javascript
  const HibpPasswords = require('HibpPasswords')

  async function passwordPwnedCount (password) {
    const count = await HibpPasswords.lookup(password)
    console.log(`Password was found ${count} times.`)
  }
```

#### Boolean response using async/await
``` javascript
  const HibpPasswords = require('HibpPasswords')

  async function passwordPwned () {
    const pwned = await HibpPasswords.lookup('aPassword')
    return (pwned) ? true : false
  }
```

## Development

Run the tests:

```sh
npm install
npm test
```

Compile the typescript:

```sh
npm run build
```

