import { Contract } from '@algorandfoundation/algorand-typescript'

export class Scontr extends Contract {
  hello(name: string): string {
    return `Hello, ${name}`
  }
}
