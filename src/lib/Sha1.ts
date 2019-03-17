import * as crypto from 'crypto'

export function sha1 (word: string): string {
  return crypto.createHash('sha1').update(word).digest('hex')
}
